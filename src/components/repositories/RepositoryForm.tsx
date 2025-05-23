import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { RepositoryModel } from '../../models';

import { RepositoryFormValues } from './types';

import './RepositoryForm.scss';
import RepositoryOverview from './RepositoryOverview';
import RepositoryFormSection from './RepositoryFormSection';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { FlexForm, FormBody } from '../pipeline-builder/form-utils';
import FormFooter from '../pipelines-details/multi-column-field/FormFooter';
import { useNavigate } from 'react-router-dom-v5-compat';

type RepositoryFormProps = FormikProps<FormikValues & RepositoryFormValues>;

type RepositoryFormExtendedProps = RepositoryFormProps & {
  isSubmittingForm: boolean;
};

export const RepositoryForm: React.FC<RepositoryFormExtendedProps> = ({
  values,
  status,
  isSubmitting,
  dirty,
  handleReset,
  handleSubmit,
  errors,
  isSubmittingForm,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [namespace] = useActiveNamespace();
  const navigate = useNavigate();
  const { showOverviewPage } = values;
  const onClose = () => {
    navigate(
      `/k8s/ns/${namespace}/${getReferenceForModel(RepositoryModel)}/${
        values.name
      }`,
    );
  };
  return (
    <FlexForm onSubmit={handleSubmit} className="opp-repository-form">
      <FormBody className="opp-repository-form__body">
        {showOverviewPage ? <RepositoryOverview /> : <RepositoryFormSection />}
      </FormBody>
      <FormFooter
        handleSubmit={showOverviewPage ? onClose : null}
        handleReset={showOverviewPage ? null : handleReset}
        errorMessage={status?.submitError}
        isSubmitting={showOverviewPage ? null : isSubmittingForm}
        submitLabel={showOverviewPage ? t('Close') : t('Add')}
        disableSubmit={
          showOverviewPage
            ? false
            : !dirty || !_.isEmpty(errors) || isSubmitting
        }
        resetLabel={t('Cancel')}
        sticky
      />
    </FlexForm>
  );
};
