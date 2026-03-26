import type { FC } from 'react';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { PipelineKind, PipelineRunKind } from '../../types';
import { LoadingInline } from '../Loading';
import PipelineVisualization from '../pipelines-details/PipelineVisualization';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: FC<PipelineRunVisualizationProps> = ({
  pipelineRun,
}) => {
  const [taskRuns, k8sLoaded, trLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  /* this needs decoupling */
  const taskRunsLoaded = k8sLoaded && trLoaded;
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
