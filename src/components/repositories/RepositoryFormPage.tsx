import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { history } from '../utils/router';

import { RepositoryForm } from './RepositoryForm';
import { RepositoryFormValues } from './types';
import {
  createRemoteWebhook,
  createRepositoryResources,
  repositoryValidationSchema,
} from './repository-form-utils';
import { usePacInfo } from './hooks';
import { defaultRepositoryFormValues } from './const';

const RepositoryFormPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  const [pac, loaded] = usePacInfo();

  const { ns } = useParams();

  const handleSubmit = (values: RepositoryFormValues, actions): void => {
    setIsSubmittingForm(true);
    createRepositoryResources(values, ns)
      .then(async () => {
        const isWebHookAttached = await createRemoteWebhook(
          values,
          pac,
          loaded,
        );
        if (isWebHookAttached) {
          actions.setFieldValue('webhook.autoAttach', true);
        }

        actions.setFieldValue('showOverviewPage', true);
        actions.setStatus({
          submitError: '',
        });
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
        setIsSubmittingForm(false);
      });
  };

  return (
    <Formik
      initialValues={defaultRepositoryFormValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={repositoryValidationSchema(t)}
    >
      {(formikProps) => {
        React.useEffect(() => {
          if (formikProps?.values?.showOverviewPage) {
            setIsSubmittingForm(false);
          }
        }, [formikProps?.values?.showOverviewPage]);

        return (
          <RepositoryForm
            {...formikProps}
            isSubmittingForm={isSubmittingForm}
          />
        );
      }}
    </Formik>
  );
};

export default RepositoryFormPage;
