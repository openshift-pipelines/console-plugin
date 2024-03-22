import * as React from 'react';
import { ComputedStatus } from '../../../types';
import { TaskStatus, getRunStatusColor } from '../../utils/pipeline-augment';
import './TaskStatusTooltip.scss';
import { useTranslation } from 'react-i18next';

interface TaskStatusToolTipProps {
  taskStatus: TaskStatus;
}

const TaskStatusToolTip: React.FC<TaskStatusToolTipProps> = ({
  taskStatus,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div className="odc-task-status-tooltip">
      {Object.keys(ComputedStatus).map((status) => {
        const { message, pftoken } = getRunStatusColor(status, t);
        return taskStatus[status] ? (
          <React.Fragment key={status}>
            <div
              className="odc-task-status-tooltip__legend"
              style={{ background: pftoken.value }}
            />
            <div>
              {status === ComputedStatus.PipelineNotStarted ||
              status === ComputedStatus.FailedToStart
                ? message
                : `${taskStatus[status]} ${message}`}
            </div>
          </React.Fragment>
        ) : null;
      })}
    </div>
  );
};

export default TaskStatusToolTip;
