from datetime import datetime, timezone
from enum import StrEnum

import sentry_sdk
from django.contrib.auth.models import AnonymousUser

from sentry import features
from sentry.incidents.endpoints.organization_alert_rule_index import create_metric_alert
from sentry.models.project import Project
from sentry.models.rule import Rule
from sentry.models.team import Team
from sentry.notifications.types import FallthroughChoiceType
from sentry.rules.conditions.new_high_priority_issue import has_high_priority_issue_alerts
from sentry.signals import project_created


def generate_iso_timestamp() -> str:
    """
    Generates an ISO 8601 timestamp with the format "YYYY-MM-DDTHH:mm:ss.sssZ".
    This matches what's generated by the frontend when creating a metric alert.
    """
    current_time = datetime.now(timezone.utc)
    return current_time.isoformat(timespec="milliseconds").replace("+00:00", "Z")


DEFAULT_ISSUE_ALERT_LABEL = "Send a notification for new issues"
DEFAULT_ISSUE_ALERT_ACTIONS = [
    {
        "id": "sentry.mail.actions.NotifyEmailAction",
        "targetType": "IssueOwners",
        "targetIdentifier": None,
        "fallthroughType": FallthroughChoiceType.ACTIVE_MEMBERS.value,
    }
]
DEFAULT_ISSUE_ALERT_DATA = {
    "action_match": "all",
    "conditions": [{"id": "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition"}],
    "actions": DEFAULT_ISSUE_ALERT_ACTIONS,
}

PRIORITY_ISSUE_ALERT_LABEL = "Send a notification for high priority issues"
PRIORITY_ISSUE_ALERT_ACTIONS = [
    {
        "id": "sentry.mail.actions.NotifyEmailAction",
        "targetType": "IssueOwners",
        "targetIdentifier": None,
        "fallthroughType": FallthroughChoiceType.ACTIVE_MEMBERS.value,
    }
]
PRIORITY_ISSUE_ALERT_DATA = {
    "action_match": "any",
    "conditions": [
        {"id": "sentry.rules.conditions.high_priority_issue.NewHighPriorityIssueCondition"},
        {"id": "sentry.rules.conditions.high_priority_issue.ExistingHighPriorityIssueCondition"},
    ],
    "actions": PRIORITY_ISSUE_ALERT_ACTIONS,
}
# TODO(snigdha): Remove this constant when seer-based-priority is GA
PLATFORMS_WITH_PRIORITY_ALERTS = ["python", "javascript"]


class TargetType(StrEnum):
    TEAM = "team"
    USER = "user"


DEFAULT_METRIC_ALERT_LABEL = "Send a notification for high number of errors"


def create_default_metric_alert_data(
    project: Project, target_type: TargetType, target_id: int
) -> dict:
    """
    Generate the body params to create a default metric alert.
    """
    triggers = []
    for label, threshold in (("critical", 5), ("warning", 2)):
        triggers.append(
            {
                "label": label,
                "alertThreshold": threshold,
                "actions": [
                    {
                        # Triggers are ordered by unsavedDateCreated, so we need
                        # to generate a unique timestamp for each trigger.
                        "unsavedDateCreated": generate_iso_timestamp(),
                        "type": "email",
                        "targetType": target_type,
                        "targetIdentifier": str(target_id),
                        "inputChannelId": None,
                        "options": None,
                    }
                ],
            }
        )

    return {
        "dataset": "events",
        "eventTypes": ["error"],
        "aggregate": "count()",
        "query": "is:unresolved",
        "timeWindow": 1,
        "thresholdPeriod": 1,
        "triggers": triggers,
        "projects": [project.slug],
        "environment": None,
        "resolveThreshold": None,
        "thresholdType": 0,
        "owner": f"{target_type}:{target_id}",
        "name": "Send a notification for high number of errors",
        "projectId": str(project.id),
        "alertType": "num_errors",
        "comparisonDelta": None,
        "queryType": 0,
    }


@project_created.connect(dispatch_uid="create_default_rules", weak=False)
def create_default_rules(
    project: Project,
    team: Team | None = None,
    default_rules=True,
    user=None,
    access=None,
    is_api_token=False,
    ip_address=None,
    sender=None,
    **kwargs,
):
    if not default_rules:
        return

    if has_high_priority_issue_alerts(project):
        rule_data = PRIORITY_ISSUE_ALERT_DATA
        Rule.objects.create(project=project, label=PRIORITY_ISSUE_ALERT_LABEL, data=rule_data)

    else:
        rule_data = DEFAULT_ISSUE_ALERT_DATA
        Rule.objects.create(project=project, label=DEFAULT_ISSUE_ALERT_LABEL, data=rule_data)

    if features.has("organizations:default-metric-alerts-new-projects", project.organization):
        # We need to send notifications to a team or user.
        if user is None and team is None:
            return

        # When user is None, we must be sending to a team which requires access
        # to also be passed.
        if user is None and access is None:
            return

        if user is None:
            user = AnonymousUser()

        # Prefer team over user is both are provided.
        if team and access:
            target_id = team.id
            target_type = TargetType.TEAM
        else:
            target_id = user.id
            target_type = TargetType.USER

        data = create_default_metric_alert_data(
            project_slug=project.slug, target_type=target_type, target_id=target_id
        )

        try:
            create_metric_alert(
                organization=project.organization,
                user=user,
                data=data,
                access=access,
                query_params={},
                is_api_token=is_api_token,
                ip_address=ip_address,
                project=project,
                sender=sender,
            )
        except Exception:
            sentry_sdk.capture_exception()
