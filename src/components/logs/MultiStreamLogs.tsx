import * as React from 'react';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';
import { PodKind } from '../../types';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName?: string;
  setCurrentLogsGetter?: (getter: () => string) => void;
  activeStep?: string;
  isHub?: boolean;
  pipelineRunName?: string;
  pipelineRunFinished?: boolean;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskName,
  setCurrentLogsGetter,
  activeStep,
  isHub,
  pipelineRunName,
  pipelineRunFinished,
}) => {
  const { containers, stillFetching } = getRenderContainers(resource);

  return (
    <>
      <div
        data-test-id="logs-task-container"
        className="pf-v5-u-h-100 pf-v5-u-w-100"
      >
        <Logs
          stillFetching={stillFetching}
          taskName={taskName}
          resource={resource}
          containers={containers}
          setCurrentLogsGetter={setCurrentLogsGetter}
          activeStep={activeStep}
          isHub={isHub}
          pipelineRunName={pipelineRunName}
          pipelineRunFinished={pipelineRunFinished}
        />
      </div>
    </>
  );
};
