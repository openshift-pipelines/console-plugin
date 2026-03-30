import type { FC } from 'react';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';
import { PodKind } from '../../types';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName?: string;
  setCurrentLogsGetter?: (getter: () => string) => void;
  activeStep?: string;
  isResourceManagedByKueue?: boolean;
  pipelineRunName?: string;
  pipelineRunFinished?: boolean;
};

export const MultiStreamLogs: FC<MultiStreamLogsProps> = ({
  resource,
  taskName,
  setCurrentLogsGetter,
  activeStep,
  isResourceManagedByKueue,
  pipelineRunName,
  pipelineRunFinished,
}) => {
  const { containers, stillFetching } = getRenderContainers(resource);

  return (
    <>
      <div
        data-test-id="logs-task-container"
        className="pf-v6-u-h-100 pf-v6-u-w-100"
      >
        <Logs
          stillFetching={stillFetching}
          taskName={taskName}
          resource={resource}
          containers={containers}
          setCurrentLogsGetter={setCurrentLogsGetter}
          activeStep={activeStep}
          isResourceManagedByKueue={isResourceManagedByKueue}
          pipelineRunName={pipelineRunName}
          pipelineRunFinished={pipelineRunFinished}
        />
      </div>
    </>
  );
};
