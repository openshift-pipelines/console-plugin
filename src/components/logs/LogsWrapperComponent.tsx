/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import {
  CompressIcon,
  DownloadIcon,
  ExpandIcon,
} from '@patternfly/react-icons/dist/js/icons';
import classNames from 'classnames';
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
};

const LogsWrapperComponent: React.FC<
  React.PropsWithChildren<LogsWrapperComponentProps>
> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
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
    <div ref={fullscreenRef} className="odc-multi-stream-logs">
      <Flex
        className={(classNames as any)({
          'odc-multi-stream-logs--fullscreen': isFullscreen,
        })}
      >
        <FlexItem
          className="odc-multi-stream-logs__button"
          align={{ default: 'alignRight' }}
        >
          <Button variant="link" onClick={downloadLogs} isInline>
            <DownloadIcon className="odc-multi-stream-logs__icon" />
            {t('Download')}
          </Button>
        </FlexItem>
        <FlexItem className="odc-multi-stream-logs__divider">|</FlexItem>
        {onDownloadAll && (
          <>
            <FlexItem className="odc-multi-stream-logs__button">
              <Button
                variant="link"
                onClick={startDownloadAll}
                isDisabled={downloadAllStatus}
                isInline
              >
                <DownloadIcon className="odc-multi-stream-logs__icon" />
                {downloadAllLabel || t('Download all')}
                {downloadAllStatus && <LoadingInline />}
              </Button>
            </FlexItem>
            <FlexItem className="odc-multi-stream-logs__divider">|</FlexItem>
          </>
        )}
        {fullscreenToggle && (
          <FlexItem className="odc-multi-stream-logs__button">
            <Button variant="link" onClick={fullscreenToggle} isInline>
              {isFullscreen ? (
                <>
                  <CompressIcon className="odc-multi-stream-logs__icon" />
                  {t('Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="odc-multi-stream-logs__icon" />
                  {t('Expand')}
                </>
              )}
            </Button>
          </FlexItem>
        )}
      </Flex>
      {!error ? (
        <MultiStreamLogs
          {...props}
          taskName={taskName}
          resource={resourceRef.current}
          setCurrentLogsGetter={setLogGetter}
        />
      ) : (
        <TektonTaskRunLog
          taskRun={taskRun}
          setCurrentLogsGetter={setLogGetter}
        />
      )}
    </div>
  );
};

export default LogsWrapperComponent;
