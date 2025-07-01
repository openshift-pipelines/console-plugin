import { Model } from '@patternfly/react-topology';

import { TopologyDataResources } from '../../types/topology-types';
import {
  getLatestPipelineRunStatus,
  getPipelinesAndPipelineRunsForResource,
} from '../utils/pipeline-utils';
import { getTopologyResourceObject } from '../utils/topology-utils';

export const getPipelinesDataModelReconciler = (
  model: Model,
  resources: TopologyDataResources,
): void => {
  if (!model || !model.nodes) {
    return;
  }

  // For all nodes, associate any pipeline data with the node
  model.nodes.forEach((node) => {
    const resource = getTopologyResourceObject(node.data);
    if (resource) {
      const pipelineData = getPipelinesAndPipelineRunsForResource(
        resource,
        resources,
      );
      if (pipelineData) {
        node.data.resources.pipelines = pipelineData.pipelines;
        node.data.resources.pipelineRuns = pipelineData.pipelineRuns;
        const { status } = getLatestPipelineRunStatus(
          pipelineData.pipelineRuns,
        );
        node.data.resources.pipelineRunStatus = status;
      }
    }
  });
};
