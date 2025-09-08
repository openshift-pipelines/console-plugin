import * as React from 'react';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';
import { PodKind } from '../../types';
import { LoadingInline } from '../Loading';
import './MultiStreamLogs.scss';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName?: string;
  setCurrentLogsGetter?: (getter: () => string) => void;
  activeStep?: string;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskName,
  setCurrentLogsGetter,
  activeStep,
}) => {
  const { containers, stillFetching } = getRenderContainers(resource);

  return (
    <>
      <div
        className="odc-multi-stream-logs__taskName"
        data-test-id="logs-taskName"
      >
        {taskName}
        {stillFetching && (
          <span className="odc-multi-stream-logs__taskName__loading-indicator">
            <LoadingInline />
          </span>
        )}
      </div>
      <div
        className="odc-multi-stream-logs__logviewer"
        data-test-id="logs-task-container"
      >
        <Logs
          resource={resource}
          containers={containers}
          setCurrentLogsGetter={setCurrentLogsGetter}
          activeStep={activeStep}
        />
      </div>
    </>
  );
};
