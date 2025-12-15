import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { PageSection } from '@patternfly/react-core';
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
    <PageSection hasBodyWrapper={false} isFilled >
      <ResourcesEventStream filters={filters} namespace={namespace} />
    </PageSection>
  );
};
export default TaskRunEvents;
