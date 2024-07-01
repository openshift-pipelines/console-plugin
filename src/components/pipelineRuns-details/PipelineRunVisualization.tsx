import * as React from 'react';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { useTaskRunsForPipelineRunOrTask } from '@aonic-ui/pipelines';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import { PipelineKind, PipelineRunKind } from '../../types';
import { LoadingInline } from '../Loading';
import PipelineVisualization from '../pipelines-details/PipelineVisualization';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';
import { aonicFetchUtils } from '../utils/common-utils';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({
  pipelineRun,
}) => {
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const [taskRuns, taskRunsLoaded] = useTaskRunsForPipelineRunOrTask(
    aonicFetchUtils,
    pipelineRun?.metadata?.namespace,
    undefined,
    isTektonResultEnabled,
    pipelineRun?.metadata?.name,
  );
  const pipeline: PipelineKind = usePipelineFromPipelineRun(pipelineRun);
  if (!pipeline) {
    return (
      <div className="pipeline-plr-loader">
        <LoadingInline />
      </div>
    );
  }
  return (
    taskRunsLoaded && (
      <PipelineVisualization
        pipeline={pipeline}
        pipelineRun={pipelineRun}
        taskRuns={taskRuns}
      />
    )
  );
};

export default PipelineRunVisualization;
