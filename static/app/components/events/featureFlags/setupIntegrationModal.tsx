import {Fragment, useCallback, useState} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {addSuccessMessage} from 'sentry/actionCreators/indicator';
import type {ModalRenderProps} from 'sentry/actionCreators/modal';
import Alert from 'sentry/components/alert';
import {Button, LinkButton} from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import SelectField from 'sentry/components/forms/fields/selectField';
import type {Data} from 'sentry/components/forms/types';
import TextCopyInput from 'sentry/components/textCopyInput';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import OrganizationStore from 'sentry/stores/organizationStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import {space} from 'sentry/styles/space';
import {defined} from 'sentry/utils';
import useApi from 'sentry/utils/useApi';

export type ChildrenProps<T> = {
  Body: (props: {children: React.ReactNode}) => ReturnType<ModalRenderProps['Body']>;
  Footer: () => ReturnType<ModalRenderProps['Footer']>;
  Header: (props: {children: React.ReactNode}) => ReturnType<ModalRenderProps['Header']>;
  state: T;
};

interface State {
  provider: string;
  url: string | undefined;
}

async function useGenerateAuthToken(state: State) {
  const api = useApi();
  const date = new Date().toISOString();

  const newToken: any = await api.requestPromise(`/api-tokens/`, {
    method: 'POST',
    data: {
      name: `${state.provider} Token ${date}`,
      scopes: [
        'project:read',
        'project:write',
        'project:admin',
        'event:read',
        'event:write',
        'event:admin',
        'org:read',
        'org:write',
        'org:admin',
      ],
    },
  });

  const token = newToken.token;
  return token;
}

export function SetupIntegrationModal<T extends Data>({
  Header,
  Body,
  Footer,
  closeModal,
}: ModalRenderProps) {
  const [state, setState] = useState<State>({
    provider: 'LaunchDarkly',
    url: undefined,
  });
  const {organization} = useLegacyStore(OrganizationStore);
  const token = useGenerateAuthToken(state);

  const handleSubmit = useCallback(() => {
    addSuccessMessage(t('Integration set up successfully'));
    closeModal();
  }, [closeModal]);

  const ModalHeader = useCallback(
    ({children: headerChildren}: {children: React.ReactNode}) => {
      return (
        <Header closeButton>
          <h3>{headerChildren}</h3>
        </Header>
      );
    },
    [Header]
  );

  const ModalFooter = useCallback(() => {
    return (
      <Footer>
        <StyledButtonBar gap={1}>
          <LinkButton priority="default" href="">
            {t('Read Docs')}
          </LinkButton>
          <Button
            priority="primary"
            title={!defined(state.provider) && t('Required fields must be filled out.')}
            onClick={() => handleSubmit()}
            disabled={!defined(state.provider)}
          >
            {t('Done')}
          </Button>
        </StyledButtonBar>
      </Footer>
    );
  }, [Footer, handleSubmit, state]);

  const ModalBody = useCallback(
    ({children: bodyChildren}: Parameters<ChildrenProps<T>['Body']>[0]) => {
      return <Body>{bodyChildren}</Body>;
    },
    [Body]
  );

  const integrations = ['LaunchDarkly'];

  return (
    <Fragment>
      <ModalHeader>{t('Set Up Feature Flag Integration')}</ModalHeader>
      <ModalBody>
        <SelectContainer>
          <SelectField
            label={t('Feature Flag Services')}
            name="provider"
            inline={false}
            options={integrations.map(integration => ({
              value: integration,
              label: integration,
            }))}
            placeholder={t('Select a feature flag service')}
            value={state.provider}
            onChange={value => setState({...state, provider: value})}
            flexibleControlStateSize
            stacked
            required
          />
          <WebhookButton
            priority="default"
            title={!defined(state.provider) && t('You must select a provider first.')}
            onClick={async () => {
              const newToken = await token;
              const provider = state.provider.toLowerCase();
              const encodedToken = encodeURI(newToken);

              setState(prevState => {
                return {
                  ...prevState,
                  url: `https://sentry.io/api/0/organizations/${organization?.slug}/flags/hooks/provider/${provider}/token/${encodedToken}/`,
                };
              });
            }}
            disabled={!defined(state.provider) || defined(state.url)}
          >
            {t('Create Webhook URL')}
          </WebhookButton>
        </SelectContainer>
        <WebhookContainer>
          {t('Webhook URL')}
          <TextCopyInput
            style={{padding: '20px'}}
            disabled={!defined(state.url)}
            placeholder={t('No webhook URL created yet')}
            aria-label={t('Webhook URL')}
            size="sm"
          >
            {state.url ?? ''}
          </TextCopyInput>
          <InfoContainer>
            {t(
              'The final step is to create a Webhook integration within your Feature flag service by utilizing the Webhook URL provided in the field above.'
            )}
            <Alert showIcon type="warning" icon={<IconWarning />}>
              {t('You won’t be able to access this URL once this modal is closed.')}
            </Alert>
          </InfoContainer>
        </WebhookContainer>
      </ModalBody>
      <ModalFooter />
    </Fragment>
  );
}

export const modalCss = css`
  width: 100%;
  max-width: 680px;
`;

const StyledButtonBar = styled(ButtonBar)`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const SelectContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  gap: ${space(1)};
`;

const WebhookButton = styled(Button)`
  margin-top: ${space(1)};
`;

const WebhookContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${space(1)};
`;

const InfoContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${space(2)};
  margin-top: ${space(1)};
`;
