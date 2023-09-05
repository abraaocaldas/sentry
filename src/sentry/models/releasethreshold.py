from django.db import models
from django.utils import timezone

from sentry.backup.scopes import RelocationScope
from sentry.db.models import FlexibleForeignKey, Model, region_silo_only_model


class ReleaseThresholdType:
    TOTAL_ERROR_COUNT = 0
    NEW_ISSUE_COUNT = 1
    UNHANDLED_ISSUE_COUNT = 2
    REGRESSED_ISSUE_COUNT = 3
    FAILURE_RATE = 4
    CRASH_FREE_SESSION_RATE = 5
    CRASH_FREE_USER_RATE = 6

    TOTAL_ERROR_COUNT_STR = "total_error_count"
    NEW_ISSUE_COUNT_STR = "new_issue_count"
    UNHANDLED_ISSUE_COUNT_STR = "unhandled_issue_count"
    REGRESSED_ISSUE_COUNT_STR = "regressed_issue_count"
    FAILURE_RATE_STR = "failure_rate"
    CRASH_FREE_SESSION_RATE_STR = "crash_free_session_rate"
    CRASH_FREE_USER_RATE_STR = "crash_free_user_rate"

    @classmethod
    def as_choices(cls):
        return (
            (cls.TOTAL_ERROR_COUNT, "Total Error Count"),
            (cls.NEW_ISSUE_COUNT, "New Issue Count"),
            (cls.UNHANDLED_ISSUE_COUNT, "Unhandled Issue Count"),
            (cls.REGRESSED_ISSUE_COUNT, "Regressed Issue Count"),
            (cls.FAILURE_RATE, "Failure Rate"),
            (cls.CRASH_FREE_SESSION_RATE, "Crash Free Session Rate"),
            (cls.CRASH_FREE_USER_RATE, "Crash Free User Rate"),
        )

    @classmethod
    def as_str_choices(cls):
        return (
            (cls.TOTAL_ERROR_COUNT_STR, cls.TOTAL_ERROR_COUNT_STR),
            (cls.NEW_ISSUE_COUNT_STR, cls.NEW_ISSUE_COUNT_STR),
            (cls.UNHANDLED_ISSUE_COUNT_STR, cls.UNHANDLED_ISSUE_COUNT_STR),
            (cls.REGRESSED_ISSUE_COUNT_STR, cls.REGRESSED_ISSUE_COUNT_STR),
            (cls.FAILURE_RATE_STR, cls.FAILURE_RATE_STR),
            (cls.CRASH_FREE_SESSION_RATE_STR, cls.CRASH_FREE_SESSION_RATE_STR),
            (cls.CRASH_FREE_USER_RATE_STR, cls.CRASH_FREE_USER_RATE_STR),
        )


class TriggerType:
    PERCENT_OVER = 0
    PERCENT_UNDER = 1
    ABSOLUTE_OVER = 2
    ABSOLUTE_UNDER = 3

    PERCENT_OVER_STR = "percent_over"
    PERCENT_UNDER_STR = "percent_under"
    ABSOLUTE_OVER_STR = "absolute_over"
    ABSOLUTE_UNDER_STR = "absolute_under"

    @classmethod
    def as_choices(cls):
        return (
            (cls.PERCENT_OVER, "Percent Over"),
            (cls.PERCENT_UNDER, "Percent Under"),
            (cls.ABSOLUTE_OVER, "Absolute Over"),
            (cls.ABSOLUTE_UNDER, "Absolute Under"),
        )

    @classmethod
    def as_str_choices(cls):
        return (
            (cls.PERCENT_OVER_STR, cls.PERCENT_OVER_STR),
            (cls.PERCENT_UNDER_STR, cls.PERCENT_UNDER_STR),
            (cls.ABSOLUTE_OVER_STR, cls.ABSOLUTE_OVER_STR),
            (cls.ABSOLUTE_UNDER_STR, cls.ABSOLUTE_UNDER_STR),
        )


@region_silo_only_model
class ReleaseThreshold(Model):
    __relocation_scope__ = RelocationScope.Excluded

    threshold_type = models.CharField(choices=ReleaseThresholdType.as_choices(), max_length=64)
    trigger_type = models.CharField(choices=TriggerType.as_choices(), max_length=64)
    value = models.IntegerField()
    window_in_seconds = models.IntegerField()

    project = FlexibleForeignKey("sentry.Project", db_index=True)
    environment = FlexibleForeignKey("sentry.Environment", null=True, db_index=True)
    date_added = models.DateTimeField(default=timezone.now)
