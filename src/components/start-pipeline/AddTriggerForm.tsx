import type { FC } from 'react';
import { FormikProps } from 'formik';
import { AddTriggerFormValues } from '../../types';
import PipelineParameterSection from './form-sections/PipelineParameterSection';
import PipelineWorkspacesSection from './form-sections/PipelineWorkspacesSection';
import { useAddTriggerParams } from '../auto-complete/autoCompleteValueParsers';
import TriggerBindingSection from './form-sections/TriggerBindingSection';

const AddTriggerForm: FC<FormikProps<AddTriggerFormValues>> = () => {
  const autoCompleteValues: string[] = useAddTriggerParams();

  return (
    <>
      <TriggerBindingSection />
      <PipelineParameterSection autoCompleteValues={autoCompleteValues} />
      <PipelineWorkspacesSection />
    </>
  );
};

export default AddTriggerForm;
