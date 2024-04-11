import { PipelineModel } from '../../models';
import { PipelineRunKind } from '../../types';
import PipelineResourceRef from '../triggers-details/PipelineResourceRef';
import { t } from '../utils/common-utils';

export const convertBackingPipelineToPipelineResourceRefProps = (
  pipelineRun: PipelineRunKind,
): React.ComponentProps<typeof PipelineResourceRef> => {
  if (pipelineRun.spec.pipelineRef) {
    return {
      resourceKind: PipelineModel.kind,
      resourceName: pipelineRun.spec.pipelineRef.name,
      namespace: pipelineRun.metadata.namespace,
    };
  }

  return {
    resourceKind: 'EmbeddedPipeLine', // intentional capitalization for EPL
    resourceName: t('Embedded Pipeline'),
  };
};
