import * as React from 'react';
import { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';

import { StartPipelineFormValues } from './types';
import { FormSection } from '@patternfly/react-core';
import PipelineParameterSection from './form-sections/PipelineParameterSection';
import PipelineWorkspacesSection from './form-sections/PipelineWorkspacesSection';
import PipelineSecretSection from '../common/PipelineSecretSection';

const StartPipelineForm: React.FC<
  FormikProps<StartPipelineFormValues>
> = () => {
  const { t } = useTranslation();
  return (
    <>
      <PipelineParameterSection />
      <PipelineWorkspacesSection />
      <FormSection title={t('Advanced options')}>
        <PipelineSecretSection />
      </FormSection>
    </>
  );
};

export default StartPipelineForm;
