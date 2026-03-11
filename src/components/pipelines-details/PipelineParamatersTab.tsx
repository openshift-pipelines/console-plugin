import type { FC } from 'react';
import { PipelineDetailsTabProps } from './types';

import PipelineForm from './PipelineForm';
import PipelineParametersForm from './PipelineParametersForm';
import { parametersValidationSchema } from './pipelineForm-validation-utils';

const PipelineParamatersTab: FC<PipelineDetailsTabProps> = ({
  obj: pipeline,
}) => {
  return (
    <PipelineForm
      PipelineFormComponent={PipelineParametersForm}
      formName="parameters"
      validationSchema={parametersValidationSchema()}
      obj={pipeline}
    />
  );
};

export default PipelineParamatersTab;
