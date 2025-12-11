import * as React from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../../consts';
import { LoadingInline } from '../Loading';
import { useTRTaskRunLog } from '../hooks/useTektonResult';
import './MultiStreamLogs.scss';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: React.FC<TektonTaskRunLogProps> = ({
  taskRun,
  setCurrentLogsGetter,
}) => {
  const taskName =
    taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
  const [trResults, trLoaded, trError] = useTRTaskRunLog(
    taskRun.metadata.namespace,
    taskRun.metadata.name,
    taskRun.metadata?.annotations?.['results.tekton.dev/record'],
  );

  React.useEffect(() => {
    setCurrentLogsGetter(() => formattedResults);
  }, [setCurrentLogsGetter, trResults]);

  const errorMessage =
    (trError as HttpError)?.code === 404 || (trError as HttpError)?.code === 500
      ? `Unable to access log for ${taskName} task`
      : null;

  // Format trResults to include taskName
  const formattedResults = React.useMemo(() => {
    if (!trResults) return '';
    const formattedTaskName = `${taskName.toUpperCase()}`;

    return `${formattedTaskName}\n${trResults}\n\n`;
  }, [trResults, taskName]);
  const lastRowIndex = trResults ? formattedResults.split('\n').length : 0;

  return (
    <>
      <div
        className="odc-multi-stream-logs__taskName"
        data-test-id="logs-taskName"
      >
        {taskName}
        {!trLoaded && !errorMessage ? (
          <span
            className="odc-multi-stream-logs__taskName__loading-indicator"
            data-test-id="loading-indicator"
          >
            <LoadingInline />
          </span>
        ) : null}
      </div>
      <div
        className="odc-multi-stream-logs__logviewer"
        data-test-id="tr-logs-task-container"
      >
        {errorMessage && (
          <div
            className="odc-pipeline-run-logs__logtext"
            data-testid="tr-logs-error-message"
          >
            {errorMessage}
          </div>
        )}
        {!errorMessage && trLoaded ? (
          <LogViewer
            hasLineNumbers={false}
            isTextWrapped={false}
            data={formattedResults}
            theme="dark"
            height="100%"
            scrollToRow={lastRowIndex}
          />
        ) : null}
      </div>
    </>
  );
};
