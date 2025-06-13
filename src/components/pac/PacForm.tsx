import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { PageSection } from '@patternfly/react-core';
import {
  ListPageHeader,
  NamespaceBar,
} from '@openshift-console/dynamic-plugin-sdk';
import { history } from '../utils/router';
import { PAC_GH_APP_NAME } from './const';
import { usePacGHManifest } from './hooks/usePacGHManifest';
import { pacValidationSchema } from './pac-validation-schema';
import PacAppForm from './PacAppForm';
import { LoadingBox } from '../status/status-box';
import { Breadcrumbs } from '../common/Breadcrumbs';

const PacForm: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { loaded, manifestData } = usePacGHManifest();

  if (!loaded) {
    return <LoadingBox />;
  }

  const breadcrumbs = [
    {
      name: t('Pipelines'),
      path: `/pipelines/ns/${namespace}`,
    },
    {
      name: t('Setup GitHub App'),
      path: undefined,
    },
  ];

  return (
    <>
      <NamespaceBar isDisabled={true} />
      <PageSection
        type="breadcrumb"
        className="co-m-nav-title--detail"
        data-test="pac-form-page-section"
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </PageSection>
      <ListPageHeader title={t('Setup GitHub App')}></ListPageHeader>

      <Formik
        initialValues={{ applicationName: PAC_GH_APP_NAME, manifestData }}
        onSubmit={() => {}}
        onReset={history.goBack}
        validateOnBlur={false}
        validateOnChange={false}
        validationSchema={pacValidationSchema(t)}
      >
        {(formikProps) => <PacAppForm {...formikProps} />}
      </Formik>
    </>
  );
};

export default PacForm;
