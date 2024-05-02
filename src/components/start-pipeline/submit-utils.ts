import {
  k8sCreate,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import { VolumeTypes } from '../../consts';
import {
  EventListenerModel,
  PipelineRunModel,
  TriggerTemplateModel,
} from '../../models';
import {
  AddTriggerFormValues,
  EventListenerKind,
  PipelineKind,
  PipelineRunKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../types';
import { StartPipelineFormValues } from './types';
import {
  createEventListener,
  createTriggerTemplate,
  exposeRoute,
  getPipelineRunFromForm,
} from './utils';

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

export const submitTrigger = async (
  pipeline: PipelineKind,
  formValues: AddTriggerFormValues,
): Promise<K8sResourceKind[]> => {
  const { triggerBinding } = formValues;
  const thisNamespace = pipeline.metadata.namespace;

  const pipelineRun: PipelineRunKind = getPipelineRunFromForm(
    pipeline,
    formValues,
    null,
    null,
    {
      generateName: true,
    },
  );
  const triggerTemplateParams: TriggerTemplateKindParam[] =
    triggerBinding.resource.spec.params.map(
      ({ name }) => ({ name } as TriggerTemplateKindParam),
    );
  const triggerTemplate: TriggerTemplateKind = createTriggerTemplate(
    pipeline,
    pipelineRun,
    triggerTemplateParams,
  );

  const eventListener: EventListenerKind = createEventListener(
    [triggerBinding.resource],
    triggerTemplate,
  );
  let resources: K8sResourceKind[];
  try {
    // Validates the modal contents, should be done first
    const ttResource = await k8sCreate({
      model: TriggerTemplateModel,
      data: triggerTemplate,
      ns: thisNamespace,
    });

    // Creates the linkages and will provide the link to non-trigger resources created
    const elResource = await k8sCreate({
      model: EventListenerModel,
      data: eventListener,
      ns: thisNamespace,
    });

    // Capture all related resources
    resources = [ttResource, elResource];
  } catch (err) {
    return Promise.reject(err);
  }

  exposeRoute(eventListener.metadata.name, thisNamespace);

  return Promise.resolve(resources);
};
