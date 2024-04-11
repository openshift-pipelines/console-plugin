import * as React from 'react';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { PipelineKind, PipelineRunKind } from '../../types';
import { LoadingInline } from '../Loading';
import PipelineVisualization from '../pipelines-details/PipelineVisualization';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({
  pipelineRun,
}) => {
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
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
