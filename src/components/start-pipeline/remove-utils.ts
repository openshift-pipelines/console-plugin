import {
  k8sDelete,
  k8sList,
  k8sPatch,
} from '@openshift-console/dynamic-plugin-sdk';
import { EventListenerModel, TriggerTemplateModel } from '../../models';
import {
  EventListenerKind,
  EventListenerKindTrigger,
  PipelineKind,
  RemoveTriggerFormValues,
} from '../../types';

export const removeTrigger = async (
  values: RemoveTriggerFormValues,
  pipeline: PipelineKind,
) => {
  const ns = pipeline.metadata.namespace;
  const selectedTriggerTemplate = values.selectedTrigger;

  // Remove the selected TriggerTemplate
  await k8sDelete({
    model: TriggerTemplateModel,
    resource: {
      metadata: { name: selectedTriggerTemplate, namespace: ns },
    },
  });

  const triggerMatchesTriggerTemplate = ({
    template,
  }: EventListenerKindTrigger) => {
    return (
      template?.ref === selectedTriggerTemplate ||
      template?.name === selectedTriggerTemplate
    );
  };

  // Get all the event listeners so we can update their references
  const eventListeners: any = await k8sList({
    model: EventListenerModel,
    queryParams: { ns },
  });
  const matchingEventListeners = eventListeners.filter(
    ({ spec: { triggers } }) => triggers.find(triggerMatchesTriggerTemplate),
  );

  const singleTriggers = ({ spec: { triggers } }) => triggers.length === 1;

  // Delete all EventListeners that only had the one trigger
  const deletableEventListeners: EventListenerKind[] =
    matchingEventListeners.filter(singleTriggers);
  await Promise.all(
    deletableEventListeners.map((eventListener) =>
      k8sDelete({ model: EventListenerModel, resource: eventListener }),
    ),
  );

  // Update all EventListeners that had more than one trigger
  const updatableEventListeners: EventListenerKind[] =
    matchingEventListeners.filter(
      (eventListener) => !singleTriggers(eventListener),
    );
  await Promise.all(
    updatableEventListeners.map((eventListener) =>
      k8sPatch({
        model: EventListenerModel,
        resource: eventListener,
        data: [
          {
            op: 'replace',
            path: '/spec/triggers',
            value: eventListener.spec.triggers.filter(
              triggerMatchesTriggerTemplate,
            ),
          },
        ],
      }),
    ),
  );

  return Promise.resolve();
};
