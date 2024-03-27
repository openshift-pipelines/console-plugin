import * as React from 'react';
import { TriggerBindingKind } from '../../types';
import { useTriggerBindingEventListenerNames } from '../utils/triggers';
import { EventListenerModel } from '../../models';
import DynamicResourceLinkList from './DynamicResourceLinkList';

type TriggerBindingEventListenersProps = {
  obj: TriggerBindingKind;
};

const TriggerBindingEventListeners: React.FC<
  TriggerBindingEventListenersProps
> = ({ obj }) => {
  const namespace = obj?.metadata.namespace;
  const eventListeners: string[] = useTriggerBindingEventListenerNames(obj);
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

export default TriggerBindingEventListeners;
