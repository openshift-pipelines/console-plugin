import * as React from 'react';
import { PipelineRunsList } from '../pipelineRuns-list';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

import './../multi-tab-list/MultiTabListPage.scss';

type PipelinePipelineRunsListProps = {
  ns?: string;
  obj?: K8sResourceKind;
};

const PipelinePipelineRunsList: React.FC<PipelinePipelineRunsListProps> = (
  props,
) => {
  const { ns, obj } = props;
  return (
    <PipelineRunsList
      namespace={ns}
      PLRsForKind={obj.kind}
      PLRsForName={obj.metadata?.name}
    />
  );
};

export default PipelinePipelineRunsList;
