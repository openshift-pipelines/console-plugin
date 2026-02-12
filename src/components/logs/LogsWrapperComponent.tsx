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
import { getMultiClusterPods } from '../utils/multi-cluster-api';
import { usePoll } from '../pipelines-metrics/poll-hook';

type LogsWrapperComponentProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error | null>;
  resource: WatchK8sResource;
  activeStep?: string;
  isResourceManagedByKueue?: boolean;
  pipelineRunName?: string;
  pipelineRunFinished?: boolean;
};

const LogsWrapperComponent: React.FC<
  React.PropsWithChildren<LogsWrapperComponentProps>
> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  activeStep,
  isResourceManagedByKueue,
  pipelineRunName,
  pipelineRunFinished,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const resourceRef = React.useRef(null);

  const k8sResource = isResourceManagedByKueue ? null : resource;
  const [obj, loaded, error] = useK8sWatchResource<PodKind>(k8sResource);

  // Multi-cluster Pod state for hub clusters
  const [mcPod, setMcPod] = React.useState<PodKind | null>(null);
  const [mcLoaded, setMcLoaded] = React.useState(false);
  const [mcError, setMcError] = React.useState<unknown>(null);

  /* Fetch Pod from multi-cluster API for hub clusters */
  const fetchMcPod = React.useCallback(async () => {
    if (!isResourceManagedByKueue || !pipelineRunName || !resource?.name || !resource?.namespace) {
      return;
    }
    try {
      const podsResponse = await getMultiClusterPods(
        resource.namespace as string,
        pipelineRunName,
      );
      const pod = podsResponse?.items?.find(
        (p) => p.metadata?.name === resource.name,
      );
      setMcPod(pod);
      if (!pod) {
        /* Simuating k8 api */
        throw new Error('Pod not found in multi-cluster API');
      }
      setMcLoaded(true);
    } catch (e) {
      setMcError(e);
      setMcLoaded(true);
    }
  }, [isResourceManagedByKueue, pipelineRunName, resource?.name, resource?.namespace]);

  // Poll every 3 seconds while PipelineRun is running, null to disable
  const pollDelay =
    isResourceManagedByKueue && !pipelineRunFinished && pipelineRunName ? 3000 : null;
  usePoll(fetchMcPod, pollDelay, resource?.name, resource?.namespace);

  const [isFullscreen, fullscreenRef, fullscreenToggle] =
    useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);
  const currentLogGetterRef = React.useRef<() => string>();

  const taskName =
    taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
    taskRun?.spec.taskRef?.name ||
    '-';
  const effectiveLoaded = isResourceManagedByKueue ? mcLoaded : loaded;
  const effectiveError = isResourceManagedByKueue ? mcError : error;
  const effectiveObj = isResourceManagedByKueue ? mcPod : obj;

  if (
    effectiveLoaded &&
    !effectiveError &&
    resource.name === effectiveObj?.metadata?.name
  ) {
    resourceRef.current = effectiveObj;
  } else if (effectiveError) {
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
        className={`pf-v5-l-flex pf-m-gap-md pf-m-align-items-center pf-m-justify-content-flex-end ${
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
              <span className="pf-v5-l-flex pf-m-row pf-m-gap-sm pf-m-align-items-center">
                <DownloadIcon />
                <span>{downloadAllLabel || t('Download all')}</span>
                {downloadAllStatus && <LoadingInline />}
              </span>
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
        {!effectiveError ? (
          <MultiStreamLogs
            {...props}
            taskName={taskName}
            resource={resourceRef.current}
            setCurrentLogsGetter={setLogGetter}
            activeStep={activeStep}
            isResourceManagedByKueue={isResourceManagedByKueue}
            pipelineRunName={pipelineRunName}
            pipelineRunFinished={pipelineRunFinished}
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
