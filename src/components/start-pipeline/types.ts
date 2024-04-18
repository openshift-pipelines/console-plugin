import {
  CommonPipelineModalFormikValues,
  PipelineModalFormWorkspaceStructure,
  TektonWorkspace,
} from '../../types';

export type PipelineModalFormWorkspace = TektonWorkspace &
  PipelineModalFormWorkspaceStructure;

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  secretOpen: boolean;
};
