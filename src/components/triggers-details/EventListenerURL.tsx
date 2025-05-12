import * as React from 'react';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';
import { EventListenerKind } from '../../types';
import { useEventListenerURL } from '../utils/triggers';

type EventListenerURLProps = {
  obj: EventListenerKind;
};

const EventListenerURL: React.FC<EventListenerURLProps> = ({ obj }) => {
  const routeURL = useEventListenerURL(obj, obj?.metadata.namespace);
  return (
    routeURL && (
      <div>
        <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
          {routeURL}
        </ClipboardCopy>
      </div>
    )
  );
};

export default EventListenerURL;
