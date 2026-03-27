import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { TaskRunKind } from '../../types';
import { TektonResourceLabel } from '../../consts';
import { LoadingInline } from '../Loading';
import { useTRTaskRunLog } from '../hooks/useTektonResult';
import { Banner } from '@patternfly/react-core';
import './TektonTaskRunLog.scss';
import '../pipelineRuns-details/PipelineRunLogs.scss';
import { useTranslation } from 'react-i18next';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: FC<TektonTaskRunLogProps> = ({
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
  useEffect(() => {
    setCurrentLogsGetter(() => formattedResults);
  }, [setCurrentLogsGetter, trResults]);

  const errorMessage = useMemo(() => {
    if (!trError) return null;
    return (trError as HttpError)?.code === 404 ||
      (trError as HttpError)?.code === 500
      ? t('Unable to access log for {{taskName}} task', { taskName })
      : null;
  }, [trError, taskName, t]);

  // Format trResults to include taskName
  const formattedResults = useMemo(() => {
    if (!trResults) return '';
    const formattedTaskName = `${taskName.toUpperCase()}`;

    return `${formattedTaskName}\n${trResults}\n\n`;
  }, [trResults, taskName]);
  const lastRowIndex = trResults ? formattedResults.split('\n').length : 0;

  return (
    <>
      <div
        data-test-id="tr-logs-task-container"
        className="odc-tekton-taskrun-log pf-v6-u-h-100 pf-v6-u-w-100"
      >
        <LogViewer
          useAnsiClasses={true}
          header={
            <Banner className="pf-v6-l-flex pf-v6-l-gap-md">
              <span
                data-test-id="logs-taskName"
                className="pf-v6-u-font-size-md"
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
