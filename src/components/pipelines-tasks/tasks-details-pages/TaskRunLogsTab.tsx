import * as React from 'react';
import { taskRunStatus } from '../../utils/pipeline-utils';
import TaskRunLogs from './TaskRunLogs';
import { TaskRunKind } from '../../../types';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunLogsTab: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const status = taskRunStatus(taskRun);

  return <TaskRunLogs taskRun={taskRun} status={status} />;
};

export default TaskRunLogsTab;
