import * as React from 'react';
import {
  FormGroup,
  Flex,
  FlexItem,
  Content,
  FormSection,
} from '@patternfly/react-core';
import { Tile } from '@patternfly/react-core/deprecated';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

import GithubSection from './GithubSection';
import WebhookSection from './WebhookSection';
import {
  ConfigMapKind,
  PacConfigurationTypes,
  RepositoryFormValues,
} from './types';

type ConfigTypeSectionProps = {
  pac: ConfigMapKind;
  formContextField?: string;
};

const ConfigTypeSection: React.FC<ConfigTypeSectionProps> = ({
  pac,
  formContextField,
}) => {
  const { values, setFieldValue } = useFormikContext<
    FormikValues & RepositoryFormValues
  >();
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { method } = _.get(values, formContextField) || values;
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <Content component="p">
        {t(
          'A GitHub App is already set up for this cluster. To use it, install the GitHub app on your personal account or GitHub organization.',
        )}
      </Content>
      <FormSection className="pf-v6-u-mt-0">
        <FormGroup fieldId="method">
          <Flex>
            <FlexItem span={3}>
              <Tile
                data-test="github"
                title={t('Use GitHub App')}
                onClick={() =>
                  setFieldValue(
                    `${fieldPrefix}method`,
                    PacConfigurationTypes.GITHUB,
                  )
                }
                isSelected={method === PacConfigurationTypes.GITHUB}
              />
            </FlexItem>
            <FlexItem span={3}>
              <Tile
                data-test="webhook"
                title={t('Setup a webhook')}
                onClick={() =>
                  setFieldValue(
                    `${fieldPrefix}method`,
                    PacConfigurationTypes.WEBHOOK,
                  )
                }
                isSelected={method === PacConfigurationTypes.WEBHOOK}
              />
            </FlexItem>
          </Flex>
        </FormGroup>
      </FormSection>
      {/* <FormSection fullWidth={method === PacConfigurationTypes.WEBHOOK || !fieldPrefix}> */}
      <FormSection>
        {method === PacConfigurationTypes.GITHUB && <GithubSection pac={pac} />}
        {method === PacConfigurationTypes.WEBHOOK && (
          <WebhookSection pac={pac} formContextField={formContextField} />
        )}
      </FormSection>
    </>
  );
};

export default ConfigTypeSection;
