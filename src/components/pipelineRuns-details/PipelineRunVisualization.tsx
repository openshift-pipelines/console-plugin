import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { usePipelineFromPipelineRun } from '../hooks/usePipelineFromPipelineRun';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { ComputedStatus, PipelineKind, PipelineRunKind } from '../../types';
import { LoadingInline } from '../Loading';
import PipelineVisualization from '../pipelines-details/PipelineVisualization';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';
import './PipelineRunVisualization.scss';

type PipelineRunVisualizationProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunVisualization: React.FC<PipelineRunVisualizationProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const plrStatus = pipelineRunFilterReducer(pipelineRun);
  // Continue polling while running, pending, or cancelling (still in progress)
  const pipelineRunFinished =
    plrStatus !== ComputedStatus.Running &&
    plrStatus !== ComputedStatus.Pending &&
    plrStatus !== ComputedStatus.Cancelling;
  const [taskRuns, taskRunsLoaded, , , pendingAdmission, proxyUnavailable] =
    useTaskRuns(pipelineRun?.metadata?.namespace, pipelineRun?.metadata?.name, {
      pipelineRunFinished,
    });
  const pipeline: PipelineKind = usePipelineFromPipelineRun(pipelineRun);
  if (!pipeline) {
    return (
      <div className="pipeline-plr-loader">
        <LoadingInline />
      </div>
    );
  }
  return (
    <>
      {proxyUnavailable && (
        <Alert
          isInline
          variant="warning"
          title={t(
            'The multi-cluster connection is unavailable. Logs and status may be delayed until connection is restored.',
          )}
        />
      )}
      {pendingAdmission && (
        <Alert
          isInline
          variant="info"
          title={t('PipelineRun is waiting to be admitted to a worker cluster')}
        />
      )}
      {taskRunsLoaded && (
        <PipelineVisualization
          pipeline={pipeline}
          pipelineRun={pipelineRun}
          taskRuns={taskRuns}
        />
      )}
    </>
  );
};

export default PipelineRunVisualization;
