import {Fragment, useMemo} from 'react';
import cloneDeep from 'lodash/cloneDeep';

import {addErrorMessage, addSuccessMessage} from 'sentry/actionCreators/indicator';
import {removeTeam, updateTeamSuccess} from 'sentry/actionCreators/teams';
import {hasEveryAccess} from 'sentry/components/acl/access';
import {Button} from 'sentry/components/button';
import Confirm from 'sentry/components/confirm';
import FieldGroup from 'sentry/components/forms/fieldGroup';
import type {FormProps} from 'sentry/components/forms/form';
import Form from 'sentry/components/forms/form';
import JsonForm from 'sentry/components/forms/jsonForm';
import type {FieldObject} from 'sentry/components/forms/types';
import Panel from 'sentry/components/panels/panel';
import PanelHeader from 'sentry/components/panels/panelHeader';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import teamSettingsFields from 'sentry/data/forms/teamSettingsFields';
import {IconDelete} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import type {RouteComponentProps} from 'sentry/types/legacyReactRouter';
import type {Team} from 'sentry/types/organization';
import {browserHistory} from 'sentry/utils/browserHistory';
import normalizeUrl from 'sentry/utils/url/normalizeUrl';
import useApi from 'sentry/utils/useApi';
import useOrganization from 'sentry/utils/useOrganization';
import PermissionAlert from 'sentry/views/settings/project/permissionAlert';

interface TeamSettingsProps extends RouteComponentProps<{teamId: string}, {}> {
  team: Team;
}

function TeamSettings({team, params}: TeamSettingsProps) {
  const organization = useOrganization();
  const api = useApi();

  const handleSubmitSuccess: FormProps['onSubmitSuccess'] = (resp: Team, _model, id) => {
    // Use the old slug when triggering the update so we correctly replace the
    // previous team in the store
    updateTeamSuccess(team.slug, resp);
    if (id === 'slug') {
      addSuccessMessage(t('Team name changed'));
      browserHistory.replace(
        normalizeUrl(`/settings/${organization.slug}/teams/${resp.slug}/settings/`)
      );
    }
  };

  const handleRemoveTeam = async () => {
    try {
      await removeTeam(api, {orgId: organization.slug, teamId: params.teamId});
      browserHistory.replace(normalizeUrl(`/settings/${organization.slug}/teams/`));
    } catch {
      // removeTeam already displays an error message
    }
  };

  const hasTeamWrite = hasEveryAccess(['team:write'], {organization, team});
  const hasTeamAdmin = hasEveryAccess(['team:admin'], {organization, team});

  const forms = useMemo(() => {
    const formsConfig = cloneDeep(teamSettingsFields);

    const teamIdField: FieldObject = {
      name: 'teamId',
      type: 'string',
      disabled: true,
      label: t('Team ID'),
      setValue(_, _name) {
        return team.id;
      },
      help: `The unique identifier for this team. It cannot be modified.`,
    };

    formsConfig[0].fields = [...formsConfig[0].fields, teamIdField];

    return formsConfig;
  }, [team]);

  return (
    <Fragment>
      <SentryDocumentTitle title={t('Team Settings')} orgSlug={organization.slug} />

      <PermissionAlert access={['team:write']} team={team} />

      <Form
        apiMethod="PUT"
        apiEndpoint={`/teams/${organization.slug}/${team.slug}/`}
        saveOnBlur
        allowUndo
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitError={() => addErrorMessage(t('Unable to save change'))}
        initialData={{
          name: team.name,
          slug: team.slug,
        }}
      >
        <JsonForm
          additionalFieldProps={{
            hasTeamWrite,
          }}
          forms={forms}
        />
      </Form>

      <Panel>
        <PanelHeader>{t('Team Administration')}</PanelHeader>
        <FieldGroup
          label={t('Remove Team')}
          help={t(
            "This may affect team members' access to projects and associated alert delivery."
          )}
        >
          <div>
            <Confirm
              disabled={!hasTeamAdmin}
              onConfirm={handleRemoveTeam}
              priority="danger"
              message={tct('Are you sure you want to remove the team [team]?', {
                team: `#${team.slug}`,
              })}
            >
              <Button
                icon={<IconDelete />}
                priority="danger"
                data-test-id="button-remove-team"
              >
                {t('Remove Team')}
              </Button>
            </Confirm>
          </div>
        </FieldGroup>
      </Panel>
    </Fragment>
  );
}

export default TeamSettings;
