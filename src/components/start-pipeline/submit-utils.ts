import { k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import { VolumeTypes } from '../../consts';
import { PipelineRunModel } from '../../models';
import { PipelineKind, PipelineRunKind } from '../../types';
import { StartPipelineFormValues } from './types';
import { getPipelineRunFromForm } from './utils';

const processWorkspaces = (
  values: StartPipelineFormValues,
): StartPipelineFormValues => {
  const { workspaces } = values;

  if (!workspaces || workspaces.length === 0) return values;

  return {
    ...values,
    workspaces: workspaces.filter(
      (workspace) => workspace.type !== VolumeTypes.NoWorkspace,
    ),
  };
};

export const submitStartPipeline = async (
  values: StartPipelineFormValues,
  pipeline: PipelineKind,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
): Promise<PipelineRunKind> => {
  let formValues = values;
  formValues = processWorkspaces(formValues);

  const pipelineRunResource: PipelineRunKind = await k8sCreate({
    model: PipelineRunModel,
    data: getPipelineRunFromForm(pipeline, formValues, labels, annotations),
  });

  return Promise.resolve(pipelineRunResource);
};
