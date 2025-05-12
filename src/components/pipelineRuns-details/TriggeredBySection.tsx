import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
    <DescriptionList className="pf-v5-u-mt-md">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Triggered by')}:</DescriptionListTerm>
        <DescriptionListDescription>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default TriggeredBySection;
