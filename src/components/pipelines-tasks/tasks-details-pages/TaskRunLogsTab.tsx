import * as React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { taskRunStatus } from '../../utils/pipeline-utils';
import TaskRunLogs from './TaskRunLogs';
import { TaskRunKind } from '../../../types';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunLogsTab: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const status = taskRunStatus(taskRun);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeStep = params?.get('step');

  return (
    <TaskRunLogs taskRun={taskRun} status={status} activeStep={activeStep} />
  );
};

export default TaskRunLogsTab;
