import * as React from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../../consts';
import { LoadingInline } from '../Loading';
import { useTRTaskRunLog } from '../hooks/useTektonResult';
import { Banner } from '@patternfly/react-core';
import './TektonTaskRunLog.scss';

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
        data-test-id="tr-logs-task-container"
        className="odc-tekton-taskrun-log pf-v5-u-h-100 pf-v5-u-w-100"
      >
        <LogViewer
          useAnsiClasses={true}
          header={
            <Banner className="pf-v5-l-flex pf-v5-l-gap-md">
              <span
                data-test-id="logs-taskName"
                className="pf-v5-u-font-size-md"
              >
                {taskName}
              </span>
              {!trLoaded && !errorMessage ? (
                <span data-test-id="loading-indicator">
                  <LoadingInline />
                </span>
              ) : null}
            </Banner>
          }
          hasLineNumbers={false}
          isTextWrapped={false}
          data={errorMessage ?? (!trLoaded ? '' : formattedResults)}
          height="100%"
          scrollToRow={lastRowIndex}
          theme="dark"
        />
      </div>
    </>
  );
};
