import { k8sGet } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineModel } from '../../models';
import { PipelineKind, PipelineRunKind } from '../../types';
import { getPipelineFromPipelineRun } from '../utils/pipeline-augment';

export const usePipelineFromPipelineRun = (
  pipelineRun: PipelineRunKind,
): PipelineKind => {
  const [pipeline, setPipeline] = React.useState<PipelineKind>(null);
  React.useEffect(() => {
    const emptyPipeline: PipelineKind = { spec: { tasks: [] } };
    const pipelineFromPipelineRun = getPipelineFromPipelineRun(pipelineRun);
    if (pipelineFromPipelineRun) {
      setPipeline(pipelineFromPipelineRun);
    } else if (pipelineRun.spec.pipelineRef?.name) {
      const pipelineName = pipelineRun.spec.pipelineRef.name;
      k8sGet({
        model: PipelineModel,
        name: pipelineName,
        ns: pipelineRun.metadata.namespace,
      })
        .then((newPipeline: PipelineKind) => {
          setPipeline(newPipeline);
        })
        .catch(() => setPipeline(emptyPipeline));
    } else {
      setPipeline(emptyPipeline);
    }
  }, [pipelineRun]);
  return pipeline;
};
