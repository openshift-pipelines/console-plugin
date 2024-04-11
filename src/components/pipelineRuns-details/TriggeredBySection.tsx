import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineRunKind } from '../../types';
import { StartedByAnnotation, StartedByLabel } from '../../consts';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { EventListenerModel } from '../../models';

type TriggeredByProps = {
  pipelineRun: PipelineRunKind;
};

const TriggeredBySection: React.FC<TriggeredByProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    pipelineRun: {
      metadata: { annotations, namespace, labels },
    },
  } = props;

  const manualTrigger = annotations?.[StartedByAnnotation.user];
  const autoTrigger = labels?.[StartedByLabel.triggers];

  if (!manualTrigger && !autoTrigger) {
    return null;
  }

  let value = null;
  if (manualTrigger) {
    value = manualTrigger;
  } else if (autoTrigger) {
    value = (
      <ResourceLink
        groupVersionKind={getGroupVersionKindForModel(EventListenerModel)}
        name={autoTrigger}
        namespace={namespace}
      />
    );
  } else {
    return null;
  }

  return (
    <dl>
      <dt>{t('Triggered by')}:</dt>
      <dd>{value}</dd>
    </dl>
  );
};

export default TriggeredBySection;
