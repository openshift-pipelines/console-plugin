import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  FormGroup,
  Hint,
  HintBody,
  PageSection,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { PageBody } from '../pipeline-builder/form-utils';
import PaneBody from '../layout/PaneBody';
import { SecretKind } from '../../types';
import { ExternalLink } from '../utils/link';
import {
  ListPageHeader,
  NamespaceBar,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { SecretModel } from '../../models';
import { Breadcrumbs } from '../common/Breadcrumbs';

import './PacPage.scss';

type PacOverviewProps = {
  namespace: string;
  secret?: SecretKind;
  loadError?: Error;
  showSuccessAlert?: boolean;
};

const PacOverview: React.FC<PacOverviewProps> = ({
  namespace,
  secret,
  loadError,
  showSuccessAlert = false,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [alertVisible, setAlertVisible] =
    React.useState<boolean>(showSuccessAlert);

  React.useEffect(() => {
    setAlertVisible(showSuccessAlert);
  }, [showSuccessAlert]);

  const breadcrumbs = [
    {
      name: t('Pipelines'),
      path: `/pipelines/ns/${namespace}`,
    },
    {
      name: t('GitHub App details'),
      path: undefined,
    },
  ];
  if (loadError || !secret?.metadata) {
    return (
      <>
        <NamespaceBar isDisabled={true} />
        <PageSection hasBodyWrapper={false}
          type="breadcrumb"
          className="co-m-nav-title--detail pipelines-console-plugin__background-transparent"
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </PageSection>
        <ListPageHeader title={t('GitHub App Details')}></ListPageHeader>
        <PageBody>
          <PaneBody className="pipelines-console-plugin__background-transparent">
            <Alert
              variant="danger"
              title={t('Something unexpected happened!!')}
              data-testId="danger-alert"
            >
              {loadError?.message && <p>{loadError.message}</p>}
            </Alert>
          </PaneBody>
        </PageBody>
      </>
    );
  }

  const {
    metadata: { name, namespace: secretNs, annotations },
  } = secret;

  return (
    <>
      <NamespaceBar isDisabled={true} />
      <PageSection hasBodyWrapper={false}
        type="breadcrumb"
        className="co-m-nav-title--detail pipelines-console-plugin__background-transparent"
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </PageSection>
      <ListPageHeader title={t('GitHub App Details')}></ListPageHeader>

      <PageBody data-test="PageBody">
        <PaneBody
          data-test="PaneBody"
          className="pipelines-console-plugin__background-transparent"
        >
          {alertVisible && (
            <Alert
              variant="success"
              title={t('You have successfully setup the GitHub App')}
              actionClose={
                <AlertActionCloseButton
                  onClose={() => setAlertVisible(false)}
                />
              }
              data-testId="success-alert"
            >
              {annotations?.appUrl && (
                <Trans t={t} ns="plugin__pipelines-console-plugin">
                  <p>
                    Use the{' '}
                    <ExternalLink href={annotations.appUrl}>link</ExternalLink>{' '}
                    to install the newly created GitHub application to your
                    repositories in your organization/account
                  </p>
                </Trans>
              )}
            </Alert>
          )}
          {!showSuccessAlert && annotations?.appUrl && (
            <Hint
              className="pipelines-console-plugin__background-transparent opp-github-app-hint-section"
              data-testid="hint-section-id"
            >
              <HintBody>
                <Trans t={t} ns="plugin__pipelines-console-plugin">
                  Use this{' '}
                  <ExternalLink href={annotations.appUrl}>link</ExternalLink> to
                  install the GitHub Application to your repositories in your
                  organization/account.
                </Trans>
              </HintBody>
            </Hint>
          )}
          <br />
          <FormGroup fieldId="app-overview">
            {annotations?.appName && (
              <FormGroup label={t('App Name')} fieldId="app-name">
                <Content component={ContentVariants.small}>
                  {annotations.appName}
                </Content>
              </FormGroup>
            )}
            <br />
            {annotations?.appUrl && (
              <FormGroup label={t('App Link')} fieldId="app-link">
                <ExternalLink
                  text={annotations.appUrl}
                  href={annotations.appUrl}
                />
              </FormGroup>
            )}
            <br />
            <FormGroup label={t('Secret')} fieldId="res-secret">
              <ResourceLink
                kind={SecretModel.kind}
                name={name}
                namespace={secretNs}
              />
            </FormGroup>
            <br />
          </FormGroup>
        </PaneBody>
      </PageBody>
    </>
  );
};

export default PacOverview;
