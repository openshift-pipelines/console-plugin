/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import {
  CompressIcon,
  DownloadIcon,
  ExpandIcon,
} from '@patternfly/react-icons/dist/js/icons';
import { saveAs } from 'file-saver';
import {
  WatchK8sResource,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { PodKind, TaskRunKind } from '../../types';
import { MultiStreamLogs } from './MultiStreamLogs';
import { TektonTaskRunLog } from './TektonTaskRunLog';
import { useFullscreen } from './fullscreen';
import { LoadingInline } from '../Loading';
import { TektonResourceLabel } from '../../consts';

type LogsWrapperComponentProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  resource: WatchK8sResource;
  activeStep?: string;
};

const LogsWrapperComponent: React.FC<
  React.PropsWithChildren<LogsWrapperComponentProps>
> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  activeStep,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const resourceRef = React.useRef(null);
  const [obj, loaded, error] = useK8sWatchResource<PodKind>(resource);
  const [isFullscreen, fullscreenRef, fullscreenToggle] =
    useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);
  const currentLogGetterRef = React.useRef<() => string>();

  const taskName =
    taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
    taskRun?.spec.taskRef?.name ||
    '-';

  if (loaded && !error && resource.name === obj.metadata.name) {
    resourceRef.current = obj;
  } else if (error) {
    resourceRef.current = null;
  }

  const downloadLogs = () => {
    if (!currentLogGetterRef.current) return;
    const logString = currentLogGetterRef.current();
    const blob = new Blob([logString], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName}.log`);
  };
  const setLogGetter = React.useCallback(
    (getter: any) => (currentLogGetterRef.current = getter),
    [],
  );

  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll()
      .then(() => {
        setDownloadAllStatus(false);
      })
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        // eslint-disable-next-line no-console
        console.warn(err.message || 'Error downloading logs.');
      });
  };

  return (
    <div
      ref={fullscreenRef}
      className="pf-v5-u-pr-xl pf-v5-u-display-flex pf-v5-u-flex-direction-column pf-v5-u-h-100 pf-v5-u-w-100"
    >
      <div
        className={`pf-v5-l-flex pf-m-gap-sm pf-m-align-items-center pf-m-justify-content-flex-end ${
          isFullscreen ? 'pf-v5-u-background-color-100 pf-v5-u-p-sm' : ''
        }`}
      >
        <Button variant="link" onClick={downloadLogs} isInline>
          <DownloadIcon className="pf-v5-u-mr-xs" />
          {t('Download')}
        </Button>
        <div>|</div>
        {onDownloadAll && (
          <>
            <Button
              variant="link"
              onClick={startDownloadAll}
              isDisabled={downloadAllStatus}
              isInline
            >
              <DownloadIcon className="pf-v5-u-mr-xs" />
              {downloadAllLabel || t('Download all')}
              {downloadAllStatus && <LoadingInline />}
            </Button>
            <div>|</div>
          </>
        )}
        {fullscreenToggle && (
          <Button variant="link" onClick={fullscreenToggle} isInline>
            {isFullscreen ? (
              <>
                <CompressIcon className="pf-v5-u-mr-xs" />
                {t('Collapse')}
              </>
            ) : (
              <>
                <ExpandIcon className="pf-v5-u-mr-xs" />
                {t('Expand')}
              </>
            )}
          </Button>
        )}
      </div>
      <div className="pf-v5-u-flex-1">
        {!error ? (
          <MultiStreamLogs
            {...props}
            taskName={taskName}
            resource={resourceRef.current}
            setCurrentLogsGetter={setLogGetter}
            activeStep={activeStep}
          />
        ) : (
          <TektonTaskRunLog
            taskRun={taskRun}
            setCurrentLogsGetter={setLogGetter}
          />
        )}
      </div>
    </div>
  );
};

export default LogsWrapperComponent;
