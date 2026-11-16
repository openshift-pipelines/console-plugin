import { DocumentTitle } from '@openshift-console/dynamic-plugin-sdk';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import * as yup from 'yup';
import BreadCrumbs from '../details-page/breadcrumbs/BreadCrumbs';
import {
  FlexForm,
  FormBody,
  FormHeader,
  PageBody,
} from '../pipeline-builder/form-utils';
import FormFooter from '../pipelines-details/multi-column-field/FormFooter';
import ClusterQueueForm from './ClusterQueueForm';
import { createInitialClusterQueueValues } from './form-utils';
import { clusterQueueFormSchema } from './validation-utils';
import './ClusterQueueCreatePage.scss';

const ClusterQueueCreatePage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const { state } = useLocation();
  const returnPath =
    typeof state?.from === 'string' &&
    /^\/(?:dev-)?pipelines\/(?:ns\/[^/?#]+|all-namespaces)(?:[/?#].*)?$/.test(
      state.from,
    )
      ? state.from
      : '/pipelines/all-namespaces';
  const title = t('Create ClusterQueue');

  return (
    <div className="pipelines-console-plugin-clusterqueue-page">
      <DocumentTitle>{title}</DocumentTitle>
      <div className="pipelines-console-plugin-clusterqueue-page__header">
        <PageBody>
          <BreadCrumbs
            breadcrumbs={[
              { name: t('Pipelines'), path: returnPath },
              { name: t('ClusterQueues'), path: '' },
              { name: title, path: '' },
            ]}
          />
          <FormHeader title={title} marginTop="lg" />
        </PageBody>
      </div>
      <Formik
        initialValues={createInitialClusterQueueValues()}
        validationSchema={yup.object({ formData: clusterQueueFormSchema(t) })}
        onSubmit={() => {}}
      >
        {({ handleSubmit }) => (
          <FlexForm onSubmit={handleSubmit}>
            <FormBody
              className="pipelines-console-plugin-clusterqueue-page__body"
              flexLayout
            >
              <ClusterQueueForm />
            </FormBody>
            <FormFooter
              sticky
              submitLabel={t('Create')}
              // Resource submission is implemented in the separate create API story.
              disableSubmit
              isSubmitting={false}
              errorMessage=""
              handleCancel={() => navigate(returnPath)}
            />
          </FlexForm>
        )}
      </Formik>
    </div>
  );
};

export default ClusterQueueCreatePage;
