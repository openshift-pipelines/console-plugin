import React from 'react';
import LogsWrapperComponent from '../../logs/LogsWrapperComponent';
import { PodModel } from '../../../models';
import { ComputedStatus, TaskRunKind } from '../../../types';
import './TaskRunLog.scss';

type Props = {
  taskRun: TaskRunKind;
  status: ComputedStatus;
  activeStep?: string;
};

const TaskRunLogs: React.FC<React.PropsWithChildren<Props>> = ({
  taskRun,
  status,
  activeStep,
}) => {
  const podName = taskRun?.status?.podName;

  if (!podName) {
    if (status === ComputedStatus.Skipped) {
      return <div>No logs. This task was skipped.</div>;
    }
    if (status === ComputedStatus.Idle) {
      return <div>Waiting on task to start.</div>;
    }
    return <div data-test="taskrun-logs-nopod">No logs found.</div>;
  }
  const podResources = {
    kind: PodModel.kind,
    isList: false,
    namespace: taskRun.metadata.namespace,
    name: taskRun.status.podName,
  };
  return (
    <div className="odc-task-run-log">
      <LogsWrapperComponent
        taskRun={taskRun}
        resource={podResources}
        activeStep={activeStep}
      />
    </div>
  );
};

export default TaskRunLogs;
