import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  TextInputTypes,
} from '@patternfly/react-core';
import { FormikProps, FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { PAC_GH_APP_DOC, PAC_GH_APP_NEW } from './const';
import PacPermissions from './PacPermissions';
import { FlexForm, FormBody } from '../pipeline-builder/form-utils';
import InputField from '../pipelines-details/multi-column-field/InputField';
import { ExternalLink } from '../utils/link';
import FormFooter from '../pipelines-details/multi-column-field/FormFooter';

import './PacPage.scss';

const PacAppForm: React.FC<FormikProps<FormikValues>> = ({
  errors,
  handleReset,
  status,
  isSubmitting,
  values,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setStatus } = useFormikContext<FormikValues>();
  const [manifestVal, setManifestVal] = React.useState<string>('');

  const submitFrom = (event: React.FormEvent<EventTarget>) => {
    if (!values.manifestData.hook_attributes.url) {
      setStatus({
        submitError: t('Unable to detect Event listener URL'),
      });
      event.preventDefault();
    } else {
      const dataMn = JSON.stringify({
        ...values.manifestData,
        name: values.applicationName,
      });
      setManifestVal(dataMn);
    }
  };
  return (
    <FlexForm
      action={PAC_GH_APP_NEW}
      onSubmit={submitFrom}
      method="post"
      data-test="form-setup-github-app"
    >
      <FormBody flexLayout className="opp-pac-form__body">
        <FormSection className="pipelines-console-plugin__page-section-width">
          <FormGroup
            label={t('GitHub application name')}
            isRequired
            fieldId="app-name-field"
          >
            <InputField
              type={TextInputTypes.text}
              name="applicationName"
              placeholder={t('Enter name of application')}
              data-test="pac-applicationName"
              required
              aria-label={t('Enter name of application')}
            />
            <input
              type="text"
              name="manifest"
              id="manifest"
              value={manifestVal}
              hidden
            />

            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t(
                    'Provide a unique name for your GitHub app, e.g. "pipelines-ci-clustername"',
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <PacPermissions />
          <ExternalLink
            text={t('View all steps in documentation')}
            href={PAC_GH_APP_DOC}
          />
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('Setup')}
        disableSubmit={
          !_.isEmpty(errors) || isSubmitting || !!status?.submitError
        }
        resetLabel={t('Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default PacAppForm;
