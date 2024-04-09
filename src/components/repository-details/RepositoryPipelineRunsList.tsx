import * as React from 'react';
import { PipelineRunsList } from '../pipelineRuns-list';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';

import './../multi-tab-list/MultiTabListPage.scss';

type RepositoryPipelineRunsListProps = {
  ns?: string;
  obj?: K8sResourceKind;
};

const RepositoryPipelineRunsList: React.FC<RepositoryPipelineRunsListProps> = (
  props,
) => {
  const { ns, obj } = props;
  return (
    <PipelineRunsList
      namespace={ns}
      PLRsForKind={obj.kind}
      PLRsForName={obj.metadata?.name}
      repositoryPLRs
    />
  );
};

export default RepositoryPipelineRunsList;
