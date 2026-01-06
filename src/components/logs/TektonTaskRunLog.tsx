import * as React from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../../consts';
import { Loading } from '../Loading';
import { useTRTaskRunLog } from '../hooks/useTektonResult';
import './MultiStreamLogs.scss';
import '../pipelineRuns-details/PipelineRunLogs.scss';
import { useTranslation } from 'react-i18next';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: React.FC<TektonTaskRunLogProps> = ({
  taskRun,
  setCurrentLogsGetter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

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

  const errorMessage = React.useMemo(() => {
    if (!trError) return null;
    return (trError as HttpError)?.code === 404 ||
      (trError as HttpError)?.code === 500
      ? t('Unable to access log for {{taskName}} task', { taskName })
      : null;
  }, [trError, taskName, t]);

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
      </div>
      {!trLoaded && !errorMessage ? (
        <Loading
          size="md"
          className="odc-multi-stream-logs__taskName__loading-indicator"
          data-test-id="loading-indicator"
        />
      ) : (
        <div
          className="odc-multi-stream-logs__logviewer"
          data-test-id="tr-logs-task-container"
        >
          {errorMessage ? (
            <div
              className="odc-multi-stream-logs__taskName__loading-indicator pf-v6-u-pl-md pf-v6-u-font-size-xs"
              data-testid="tr-logs-error-message"
            >
              {errorMessage}
            </div>
          ) : !formattedResults ? (
            <div
              className="odc-multi-stream-logs__taskName__loading-indicator pf-v6-u-pl-md pf-v6-u-font-size-xs"
              data-testid="tr-logs-no-data"
            >
              {t('No logs to display for {{taskName}} task')}
            </div>
          ) : (
            <LogViewer
              hasLineNumbers={false}
              isTextWrapped={false}
              data={formattedResults}
              theme="dark"
              height="100%"
              scrollToRow={lastRowIndex}
            />
          )}
        </div>
      )}
    </>
  );
};
