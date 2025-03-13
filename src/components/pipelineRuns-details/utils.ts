import { PipelineModel } from '../../models';
import { PipelineRunKind } from '../../types';
import PipelineResourceRef from '../triggers-details/PipelineResourceRef';
import { t } from '../utils/common-utils';
import { groupVersionFor } from '../utils/k8s-utils';

export const convertBackingPipelineToPipelineResourceRefProps = (
  pipelineRun: PipelineRunKind,
): React.ComponentProps<typeof PipelineResourceRef> => {
  if (pipelineRun.spec.pipelineRef) {
    const { version } = groupVersionFor(pipelineRun.apiVersion);
    return {
      resourceKind: PipelineModel.kind,
      resourceName: pipelineRun.spec.pipelineRef.name,
      namespace: pipelineRun.metadata.namespace,
      resourceApiVersion: version,
    };
  }

  return {
    resourceKind: 'EmbeddedPipeLine', // intentional capitalization for EPL
    resourceName: t('Embedded Pipeline'),
  };
};
