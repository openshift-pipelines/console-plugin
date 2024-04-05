import {
  WatchK8sResource,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { TektonResourceLabel } from '../../consts';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getLatestRun } from '../utils/pipeline-augment';

export const useLatestPipelineRun = (
  pipelineName: string,
  namespace: string,
): PipelineRunKind => {
  const pipelineRunResource: WatchK8sResource = {
    kind: getReferenceForModel(PipelineRunModel),
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useK8sWatchResource<PipelineRunKind[]>(pipelineRunResource);

  const latestRun = getLatestRun(pipelineRun, 'creationTimestamp');
  return pipelineRunLoaded && !pipelineRunError ? latestRun : null;
};
