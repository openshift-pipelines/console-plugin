import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useTaskRunFilters } from './event-utils';
import { ResourcesEventStream } from './events';
import { TaskRunKind } from '../../../../types';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunEvents: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { ns: namespace } = useParams();
  const filters = useTaskRunFilters(namespace, taskRun);
  return (
    <div className="co-m-pane__body">
      <ResourcesEventStream filters={filters} namespace={namespace} />
    </div>
  );
};
export default TaskRunEvents;
