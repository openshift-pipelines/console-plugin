import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { PipelineRunKind } from '../../types';
import { ResourcesEventStream } from '../pipelines-tasks/tasks-details-pages/events/events';
import { usePipelineRunFilters } from '../pipelines-tasks/tasks-details-pages/events/event-utils';

type PipelineRunEventsProps = {
  obj: PipelineRunKind;
};

const PipelineRunEvents: React.FC<PipelineRunEventsProps> = ({
  obj: pipelineRun,
}) => {
  const { ns: namespace } = useParams();
  return (
    <>
      <ResourcesEventStream
        filters={usePipelineRunFilters(namespace, pipelineRun)}
        namespace={namespace}
      />
    </>
  );
};
export default PipelineRunEvents;
