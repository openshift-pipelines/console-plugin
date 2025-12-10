import * as React from 'react';
import cx from 'classnames';
import {
  Content,
  TextInputTypes,
  FormGroup,
  ClipboardCopy,
  InputGroup,
  ExpandableSection,
  Button,
  Tooltip,
  InputGroupItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
  FormSection,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { FormikValues, useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';

import PermissionsSection from './PermissionsSection';
import { ConfigMapKind } from './types';
import {
  K8sResourceCommon,
  K8sResourceKind,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { SecretModel } from '../../models';
import { GitProvider } from '../utils/repository-utils';
import InputField from '../pipelines-details/multi-column-field/InputField';
import RadioGroupField from '../pipeline-builder/RadioGroupField';
import { ExternalLink } from '../utils/link';
import { AccessTokenDocLinks, WebhookDocLinks } from './const';
import { generateSecret } from './utils';
import ResourceDropdown from '../common/ResourceDropdown';

import './RepositoryForm.scss';

type WebhoookSectionProps = {
  pac: ConfigMapKind;
  formContextField?: string;
};

const WebhookSection: React.FC<WebhoookSectionProps> = ({
  pac,
  formContextField,
}) => {
  const [namespace] = useActiveNamespace();
  const { values, setFieldValue, setFieldTouched } =
    useFormikContext<FormikValues>();
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { gitProvider, webhook } = _.get(values, formContextField) || values;
  const [controllerUrl, setControllerUrl] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('');
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  React.useEffect(() => {
    const ctlUrl = pac?.data?.['controller-url'];
    if (ctlUrl) {
      setControllerUrl(ctlUrl);
      setFieldValue(`${fieldPrefix}webhook.url`, ctlUrl);
    }
  }, [fieldPrefix, pac, setFieldValue]);
  const autocompleteFilter = (text: string, item: any): boolean =>
    fuzzy(text, item?.props?.name);
  const secretResource = {
    isList: true,
    kind: SecretModel.kind,
    namespace: namespace,
    prop: SecretModel.id,
  };

  const [secrets, loaded, loadError] =
    useK8sWatchResource<K8sResourceCommon[]>(secretResource);
  const generateWebhookSecret = () => {
    setWebhookSecret(generateSecret());
  };

  const getPermssionSectionHeading = (git: GitProvider) => {
    switch (git) {
      case GitProvider.GITHUB:
        return t('See GitHub events');
      case GitProvider.GITLAB:
        return t('See Gitlab events');
      case GitProvider.BITBUCKET:
        return t('See BitBucket events');
      default:
        return t('See Git events');
    }
  };

  const HelpText = (): React.ReactElement => {
    let helpText: React.ReactNode;
    switch (gitProvider) {
      case GitProvider.GITHUB:
        helpText = (
          <Trans t={t} ns="plugin__pipelines-console-plugin">
            Use your GitHub Personal token. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.GITHUB]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a <b>classic</b> token with <b>repo</b> &{' '}
            <b>admin:repo_hook</b> scopes and give your token an expiration, i.e
            30d.
          </Trans>
        );
        break;

      case GitProvider.GITLAB:
        helpText = (
          <Trans t={t} ns="plugin__pipelines-console-plugin">
            Use your Gitlab Personal access token. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.GITLAB]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with <b>api</b> scope. Select the role as{' '}
            <b>Maintainer/Owner</b>. Give your token an expiration i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.BITBUCKET:
        helpText = (
          <Trans t={t} ns="plugin__pipelines-console-plugin">
            Use your Bitbucket App password. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.BITBUCKET]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with <b>Read and Write </b>scopes in{' '}
            <b>
              Account, Workspace membership, Projects, Issues, Pull requests and
              Webhooks
            </b>
            .
          </Trans>
        );
        break;

      default:
        helpText = (
          <Trans t={t} ns="plugin__pipelines-console-plugin">
            Use your Git Personal token. Create a token with repo, public_repo &
            admin:repo_hook scopes and give your token an expiration, i.e 30d.
          </Trans>
        );
    }

    return <div data-test={`${values.gitProvider}-helptext`}>{helpText}</div>;
  };

  return (
    <FormSection>
      {gitProvider && gitProvider === GitProvider.BITBUCKET ? (
        <InputField
          label={t('Bitbucket username')}
          name={`${fieldPrefix}webhook.user`}
          type={TextInputTypes.text}
          required
        />
      ) : null}
      <RadioGroupField
        name={`${fieldPrefix}webhook.method`}
        label={t('Secret')}
        labelIcon={
          <Tooltip
            position="right"
            content={
              <p>
                {t(
                  'The secret is required to set the Build status and to attach the webhook to the Git repository.',
                )}
              </p>
            }
          >
            <HelpIcon />
          </Tooltip>
        }
        required
        options={[
          {
            value: 'token',
            label: t('Git access token'),
            activeChildren: (
              <InputField
                name={`${fieldPrefix}webhook.token`}
                type={TextInputTypes.text}
                helpText={<HelpText />}
                required
              />
            ),
          },
          {
            value: 'secret',
            label: t('Git access token secret'),

            activeChildren: (
              <ResourceDropdown
                helpText={t(
                  'Secret with the Git access token for pulling pipeline and tasks from your Git repository.',
                )}
                name={`${fieldPrefix}webhook.secretRef`}
                id={`${fieldPrefix}webhook.secretRef`}
                selectedKey={`${fieldPrefix}webhook.secretRef`}
                resources={[
                  {
                    kind: SecretModel.kind,
                    loaded,
                    loadError,
                    data: secrets as K8sResourceKind[],
                  },
                ]}
                loaded={loaded}
                loadError={loadError}
                dataSelector={['metadata', 'name']}
                placeholder={t('Select a secret')}
                autocompleteFilter={autocompleteFilter}
                dropDownClassName={cx({ 'dropdown--full-width': true })}
                buttonClassName={cx({ 'dropdown--full-width': true })}
                dropDownContentClassName="pipelines-console-plugin__flexBetween"
                fullWidth
                showBadge
                onChange={(k, v, res) => {
                  if (res && res.data) {
                    setFieldValue(`${fieldPrefix}webhook.secretObj`, res);
                    setFieldValue(`${fieldPrefix}webhook.secretRef`, k);
                    const secret = res?.data['webhook.secret'];
                    if (secret) {
                      try {
                        setWebhookSecret(Base64.decode(secret));
                      } catch (err) {
                        console.warn(
                          'Invalid Base64 string in webhook.secret:',
                          secret,
                          err,
                        );
                      }
                    }
                    setTimeout(() => {
                      setFieldTouched(`${fieldPrefix}webhook.secretRef`, true);
                      setFieldTouched(`${fieldPrefix}webhook.secretObj`, true);
                    }, 0);
                  }
                }}
              />
            ),
          },
        ]}
      />
      {webhook?.url && (
        <FormGroup fieldId="test" label={t('Webhook URL')}>
          <ClipboardCopy
            isReadOnly
            name={`${fieldPrefix}webhook.url`}
            hoverTip="Copy"
            clickTip="Copied"
            style={{ flex: '1' }}
          >
            {controllerUrl}
          </ClipboardCopy>

          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  'We have detected a URL that can be used to configure the webhook. It will be created and attached to the Git repository.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      )}

      {gitProvider && gitProvider !== GitProvider.BITBUCKET ? (
        <FormGroup
          fieldId={'webhook-secret-clipboard'}
          label={t('Webhook secret')}
        >
          <InputGroup style={{ display: 'flex' }}>
            <InputGroupItem>
              <ClipboardCopy
                name={`${fieldPrefix}webhook.secret`}
                hoverTip="Copy"
                clickTip="Copied"
                style={{ flex: '1' }}
                onChange={(_event, v) => {
                  setFieldValue(`${fieldPrefix}webhook.secret`, v);
                }}
              >
                {webhookSecret}
              </ClipboardCopy>
            </InputGroupItem>
            <InputGroupItem>
              <Button
                data-test="generate-secret"
                variant="control"
                onClick={generateWebhookSecret}
              >
                {t('Generate')}
              </Button>
            </InputGroupItem>
          </InputGroup>
        </FormGroup>
      ) : null}

      {gitProvider && gitProvider !== GitProvider.UNSURE ? (
        <>
          <ExpandableSection
            toggleText={getPermssionSectionHeading(gitProvider)}
          >
            <FormGroup
              label={t('Events triggering the webhook: ')}
              fieldId="repo-permissions"
            >
              <Content component="p">
                <PermissionsSection formContextField={formContextField} />
              </Content>
            </FormGroup>
          </ExpandableSection>

          <ExternalLink
            text={t('Read more about setting up webhook')}
            href={WebhookDocLinks[gitProvider]}
          />
        </>
      ) : null}
    </FormSection>
  );
};

export default WebhookSection;
