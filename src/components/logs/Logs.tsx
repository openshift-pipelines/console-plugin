import * as React from 'react';
import { Alert, Banner } from '@patternfly/react-core';
import { LogViewer } from '@patternfly/react-log-viewer';
import { Base64 } from 'js-base64';
import { useTranslation } from 'react-i18next';
import { consoleFetchText } from '@openshift-console/dynamic-plugin-sdk';
import { LOG_SOURCE_TERMINATED } from '../../consts';
import { WSFactory } from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/ws-factory';
import { ContainerSpec, ContainerStatus, PodKind } from '../../types';
import { PodModel } from '../../models';
import { resourceURL } from '../utils/k8s-utils';
import { containerToLogSourceStatus } from '../utils/pipeline-utils';
import { LoadingInline } from '../Loading';
import {
  getMultiClusterLogsUrl,
  getMultiClusterLogsStreamPath,
} from '../utils/multi-cluster-api';

type LogsProps = {
  resource: PodKind;
  containers: ContainerSpec[];
  setCurrentLogsGetter?: (getter: () => string) => void;
  activeStep?: string;
  taskName?: string;
  stillFetching?: boolean;
  isResourceManagedByKueue?: boolean;
  pipelineRunName?: string;
  pipelineRunFinished?: boolean;
};

type LogData = {
  [containerName: string]: {
    logs: string[];
    status: string;
  };
};

const processLogData = (
  logData: LogData,
  containers: ContainerSpec[],
): string => {
  let result = '';

  containers.map(({ name: containerName }) => {
    if (logData[containerName]) {
      const { logs } = logData[containerName];
      const uniqueLogs = Array.from(new Set(logs));
      const filteredLogs = uniqueLogs.filter((log) => log.trim() !== '');
      const formattedContainerName = `${containerName.toUpperCase()}`;

      if (filteredLogs.length === 0) {
        result += `${formattedContainerName}\n\n`;
      } else {
        const joinedLogs = filteredLogs.join('\n');
        result += `${formattedContainerName}\n${joinedLogs}\n\n`;
      }
    }
  });
  return result;
};

const Logs: React.FC<LogsProps> = ({
  stillFetching,
  resource,
  taskName,
  containers,
  setCurrentLogsGetter,
  activeStep,
  isResourceManagedByKueue,
  pipelineRunName,
  pipelineRunFinished,
}) => {
  if (!resource) return null;
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { metadata = {} } = resource;
  const { name: resName, namespace: resNamespace } = metadata;
  const [error, setError] = React.useState<boolean>(false);
  const [logData, setLogData] = React.useState<LogData>({});
  const [formattedLogString, setFormattedLogString] = React.useState('');
  const [scrollToRow, setScrollToRow] = React.useState<number>(0);
  const [activeContainers, setActiveContainers] = React.useState<Set<string>>(
    new Set(),
  );

  // Ref to track current pipelineRunFinished value for WebSocket retry logic
  const pipelineRunFinishedRef = React.useRef(pipelineRunFinished);
  React.useEffect(() => {
    pipelineRunFinishedRef.current = pipelineRunFinished;
  }, [pipelineRunFinished]);

  const findTargetRowForActiveStep = React.useMemo(
    () => (formattedString: string) => {
      if (!activeStep) return null;
      const lines = formattedString.split('\n');
      let targetLine: number | null = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`STEP-${activeStep}`.toUpperCase())) {
          targetLine = i;
          break;
        }
      }
      return targetLine;
    },
    [activeStep],
  );

  React.useEffect(() => {
    setCurrentLogsGetter(() => {
      return formattedLogString;
    });
  }, [setCurrentLogsGetter, formattedLogString]);

  const appendMessage = React.useCallback(
    (containerName: string, blockContent: string, resourceStatus: string) => {
      if (blockContent) {
        setLogData((prevLogData) => {
          if (resourceStatus === 'terminated') {
            // Replace the entire content with blockContent
            return {
              ...prevLogData,
              [containerName]: {
                logs: [blockContent],
                status: resourceStatus,
              },
            };
          } else {
            // Otherwise, append the blockContent to the existing logs
            const existingLogs = prevLogData[containerName]?.logs || [];
            const updatedLogs = [...existingLogs, blockContent.trimEnd()];

            return {
              ...prevLogData,
              [containerName]: {
                logs: updatedLogs,
                status: resourceStatus,
              },
            };
          }
        });
      }
    },
    [],
  );

  const retryWebSocket = (
    watchURL: string,
    wsOpts: any,
    onMessage: (message: string) => void,
    onError: () => void,
    retryCount = 0,
  ) => {
    const ws = new WSFactory(watchURL, wsOpts);
    const handleError = () => {
      if (retryCount < 5) {
        setTimeout(() => {
          retryWebSocket(watchURL, wsOpts, onMessage, onError, retryCount + 1);
        }, 3000); // Retry after 3 seconds
      } else {
        onError();
      }
    };

    ws.onmessage((msg) => {
      const message = Base64.decode(msg);
      onMessage(message);
    }).onerror(() => {
      handleError();
    });

    return ws;
  };

  /* 
  Why are we retrying websockets in multicluster ?
    Container initialization delays: On spoke clusters, containers may not start immediately after admission
    Network latency: Multi-cluster proxy-aae service adds another hop
    WebSocket closes early: The connection sometimes closes before the container is ready, requiring retry on onclose
  */
  const retryMultiClusterWebSocket = (
    watchURL: string,
    wsOpts: any,
    onMessage: (message: string) => void,
    onError: () => void,
    retryCount = 0,
    isFinishedGetter: () => boolean,
  ) => {
    const mcWs = new WSFactory(watchURL, wsOpts);
    let receivedData = false;
    let destroyed = false;
    let retryScheduled = false;

    const handleRetry = () => {
      if (destroyed || retryScheduled) return;
      retryScheduled = true;
      // Stop retrying if PipelineRun has finished
      if (isFinishedGetter()) {
        return;
      }
      if (retryCount < 10) {
        // Retry up to 10 times (30 seconds total)
        setTimeout(() => {
          if (!destroyed && !isFinishedGetter()) {
            retryMultiClusterWebSocket(
              watchURL,
              wsOpts,
              onMessage,
              onError,
              retryCount + 1,
              isFinishedGetter,
            );
          }
        }, 3000);
      } else {
        onError();
      }
    };

    // Multi-cluster logs are plain text, not base64 encoded
    mcWs
      .onopen(() => {})
      .onmessage((msg) => {
        receivedData = true;
        onMessage(msg);
      })
      .onerror((err) => {
        console.error('MC WebSocket ERROR:', err);
        handleRetry();
      })
      .onclose(() => {
        // Retry on close if we never received any data (container likely initializing)
        if (!receivedData) {
          handleRetry();
        }
      });

    // Override destroy to prevent retries after cleanup
    const originalDestroy = mcWs.destroy.bind(mcWs);
    mcWs.destroy = () => {
      destroyed = true;
      originalDestroy();
    };

    return mcWs;
  };

  React.useEffect(() => {
    containers.forEach((container) => {
      if (activeContainers.has(container.name)) return;
      setActiveContainers((prev) => new Set(prev).add(container.name));
      let loaded = false;
      let ws: WSFactory;
      let mcWs: WSFactory;
      const { name } = container;

      // Build URL based on hub cluster vs local cluster
      const k8sUrlOpts = {
        ns: resNamespace,
        name: resName,
        path: 'log',
        queryParams: {
          container: name,
          follow: 'true',
          timestamps: 'true',
        },
      };
      const k8sWatchURL = resourceURL(PodModel, k8sUrlOpts);

      const containerStatus: ContainerStatus[] =
        resource?.status?.containerStatuses ?? [];
      const statusIndex = containerStatus.findIndex(
        (c) => c.name === container.name,
      );
      const resourceStatus = containerToLogSourceStatus(
        containerStatus[statusIndex],
      );

      // Use HTTP fetch for completed PipelineRuns or terminated containers
      // Use WebSocket only for actively running containers
      const shouldUseHttp =
        resourceStatus === LOG_SOURCE_TERMINATED ||
        (isResourceManagedByKueue && pipelineRunFinished);

      if (shouldUseHttp) {
        // Fetch complete logs via HTTP
        const logsUrl =
          isResourceManagedByKueue && pipelineRunName
            ? getMultiClusterLogsUrl(
                resNamespace,
                pipelineRunName,
                resName,
                name,
              )
            : k8sWatchURL;

        consoleFetchText(logsUrl)
          .then((res) => {
            if (loaded) return;
            appendMessage(name, res, resourceStatus);
          })
          .catch((err) => {
            if (loaded) return;
            setError(true);
          });
      } else {
        // Stream logs via WebSocket for running containers
        if (isResourceManagedByKueue && pipelineRunName) {
          // Use multi-cluster WebSocket for hub clusters
          const mcWsPath = getMultiClusterLogsStreamPath(
            resNamespace,
            pipelineRunName,
            resName,
            name,
          );
          const mcWsOpts = {
            host: 'auto',
            path: mcWsPath,
            subprotocols: ['binary.k8s.io'],
          };
          mcWs = retryMultiClusterWebSocket(
            mcWsPath,
            mcWsOpts,
            (message) => {
              if (loaded) return;
              setError(false);
              appendMessage(name, message, resourceStatus);
            },
            () => {
              if (loaded) return;
              setError(true);
            },
            0,
            () => pipelineRunFinishedRef.current,
          );
        } else {
          // Use k8s WebSocket for local clusters
          const wsOpts = {
            host: 'auto',
            path: k8sWatchURL,
            subprotocols: ['base64.binary.k8s.io'],
          };
          ws = retryWebSocket(
            k8sWatchURL,
            wsOpts,
            (message) => {
              if (loaded) return;
              setError(false);
              appendMessage(name, message, resourceStatus);
            },
            () => {
              if (loaded) return;
              setError(true);
            },
          );
        }
      }
      return () => {
        loaded = true;
        if (ws) {
          ws.destroy();
        }
        if (mcWs) {
          mcWs.destroy();
        }
      };
    });
  }, [
    resName,
    resNamespace,
    resource?.status?.containerStatuses,
    activeContainers,
    isResourceManagedByKueue,
    pipelineRunName,
    pipelineRunFinished,
  ]);

  React.useEffect(() => {
    const formattedString = processLogData(logData, containers);
    const targetRow = findTargetRowForActiveStep(formattedString);
    if (typeof targetRow === 'number') {
      setScrollToRow(targetRow);
      const searchTerm = `STEP-${activeStep}`.toUpperCase();
      const formattedStringAfterHighlighting = formattedString.replace(
        new RegExp(`(${searchTerm})`, 'gi'),
        '\x1b[48;2;253;240;171m\x1b[38;2;21;21;21m$1\x1b[0m',
      ); // yellow background with dark text
      setFormattedLogString(formattedStringAfterHighlighting);
      let isHighlighted = true;
      const blinkInterval = setInterval(() => {
        if (isHighlighted) {
          setFormattedLogString(formattedString);
        } else {
          setFormattedLogString(formattedStringAfterHighlighting);
        }
        isHighlighted = !isHighlighted;
      }, 300);
      const stopBlinkingTimeout = setTimeout(() => {
        clearInterval(blinkInterval);
        setFormattedLogString(formattedString);
      }, 1000);
      return () => {
        clearInterval(blinkInterval);
        clearTimeout(stopBlinkingTimeout);
      };
    } else {
      const totalLines = formattedString.split('\n').length;
      setScrollToRow(totalLines);
      setFormattedLogString(formattedString);
    }
  }, [logData, activeStep, findTargetRowForActiveStep]);

  return (
    <div className="pf-v5-u-h-100 pf-v5-u-w-100">
      {error && (
        <Alert
          variant="danger"
          isInline
          title={t('An error occurred while retrieving the requested logs.')}
        />
      )}
      <LogViewer
        useAnsiClasses={true}
        header={
          <Banner className="pf-v5-l-flex pf-v5-l-gap-md">
            <span data-test-id="logs-taskName" className="pf-v5-u-font-size-md">
              {taskName}
            </span>
            {stillFetching ? (
              <span data-test-id="loading-indicator">
                <LoadingInline />
              </span>
            ) : null}
          </Banner>
        }
        hasLineNumbers={false}
        isTextWrapped={false}
        data={
          error
            ? t('An error occurred while retrieving the requested logs.')
            : formattedLogString
        }
        theme="dark"
        scrollToRow={scrollToRow}
        height="100%"
      />
    </div>
  );
};

export default Logs;
