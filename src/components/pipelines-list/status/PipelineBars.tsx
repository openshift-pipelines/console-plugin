import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../../types';
import TaskStatusToolTip from './TaskStatusTooltip';
import { getRunStatusColor } from '../../utils/pipeline-augment';
import { useTaskStatus } from '../../hooks/useTaskStatus';
import HorizontalStackedBars from '../../charts/HorizontalStackedBars';
import { useTranslation } from 'react-i18next';

export interface PipelineBarProps {
  pipelinerun: PipelineRunKind;
  taskRuns: TaskRunKind[];
}

export const PipelineBars: React.FC<PipelineBarProps> = ({
  pipelinerun,
  taskRuns,
}) => {
  const taskStatus = useTaskStatus(pipelinerun, taskRuns);
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Tooltip content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <HorizontalStackedBars
        height="1em"
        inline
        values={Object.keys(ComputedStatus).map((status) => ({
          color: getRunStatusColor(ComputedStatus[status], t).pftoken.value,
          name: status,
          size: taskStatus[ComputedStatus[status]],
        }))}
      />
    </Tooltip>
  );
};
