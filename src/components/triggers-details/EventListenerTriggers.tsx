import * as React from 'react';
import * as _ from 'lodash';
import { getEventListenerTriggerBindingNames } from '../utils/triggers';
import {
  EventListenerKind,
  EventListenerKindTrigger,
  ResourceModelLink,
} from '../../types';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { TriggerTemplateModel } from '../../models';
import DynamicResourceLinkList from './DynamicResourceLinkList';

interface EventListenerTriggersProps {
  obj: EventListenerKind;
}

const EventListenerTriggers: React.FC<EventListenerTriggersProps> = ({
  obj,
}) => {
  const namespace = obj?.metadata.namespace;
  const triggers: EventListenerKindTrigger[] =
    obj.spec.triggers?.filter(
      (trigger) => trigger.template?.ref || trigger.template?.name,
    ) || [];
  const triggerTemplates = triggers.filter(
    (tr) => tr.template?.ref || tr.template?.name,
  );
  if (triggerTemplates.length === 0) {
    return null;
  }
  return (
    <div>
      {triggerTemplates.map((trigger) => {
        const triggerTemplateName =
          trigger.template?.ref || trigger.template?.name;
        const bindings: ResourceModelLink[] =
          getEventListenerTriggerBindingNames(trigger.bindings);
        return (
          <div key={`${triggerTemplateName}`}>
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(
                TriggerTemplateModel,
              )}
              name={triggerTemplateName}
              displayName={triggerTemplateName}
              namespace={namespace}
              title={triggerTemplateName}
              inline
            />
            {!_.isEmpty(bindings) && (
              <div className="odc-event-listener-triggers__bindings">
                <DynamicResourceLinkList
                  links={bindings}
                  namespace={namespace}
                  removeSpaceBelow
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EventListenerTriggers;
