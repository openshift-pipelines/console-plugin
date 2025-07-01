import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getRunStatusColor } from '../../utils/pipeline-augment';
import { useTaskStatus } from '../../hooks/useTaskStatus';
import HorizontalStackedBars from '../../charts/HorizontalStackedBars';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../../types';
import TaskStatusToolTip from '../../pipelines-list/status/TaskStatusTooltip';
import './PipelineBuildDecoratorTooltip.scss';

export interface PipelineBuildDecoratorTooltipProps {
  pipelineRun: PipelineRunKind;
  status: string;
  taskRuns: TaskRunKind[];
}

const PipelineBuildDecoratorTooltip: React.FC<
  PipelineBuildDecoratorTooltipProps
> = ({ pipelineRun, status, taskRuns }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const taskStatus = useTaskStatus(pipelineRun, taskRuns);
  if (!pipelineRun || !status) {
    return null;
  }
  const pipelineBars = (
    <HorizontalStackedBars
      height="1em"
      inline
      values={Object.keys(ComputedStatus).map((rStatus) => ({
        color: getRunStatusColor(ComputedStatus[rStatus], t).pftoken.value,
        name: rStatus,
        size: taskStatus[ComputedStatus[rStatus]],
      }))}
    />
  );
  const breakdownInfo = <TaskStatusToolTip taskStatus={taskStatus} />;

  return (
    <div className="odc-pipeline-build-decorator-tooltip">
      <div className="odc-pipeline-build-decorator-tooltip__title">
        {t('Pipeline {{status}}', { status })}
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-bars-wrapper">
        <div className="odc-pipeline-build-decorator-tooltip__status-bars-title">
          {t('Task status')}
        </div>
        <div className="odc-pipeline-build-decorator-tooltip__status-bars">
          {pipelineBars}
        </div>
      </div>
      <div className="odc-pipeline-build-decorator-tooltip__status-breakdown">
        {breakdownInfo}
      </div>
    </div>
  );
};

export default PipelineBuildDecoratorTooltip;
