import * as React from 'react';
import { TriggerTemplateKind } from '../../types';
import { useTriggerTemplateEventListenerNames } from '../utils/triggers';
import { EventListenerModel } from '../../models';
import DynamicResourceLinkList from './DynamicResourceLinkList';

type TriggerTemplateEventListenersProps = {
  obj: TriggerTemplateKind;
};

const TriggerTemplateEventListeners: React.FC<
  TriggerTemplateEventListenersProps
> = ({ obj }) => {
  const namespace = obj?.metadata.namespace;
  const eventListeners: string[] = useTriggerTemplateEventListenerNames(obj);
  return (
    <DynamicResourceLinkList
      links={eventListeners.map((name) => ({
        resourceKind: EventListenerModel.kind,
        name,
      }))}
      namespace={namespace}
    />
  );
};

export default TriggerTemplateEventListeners;
