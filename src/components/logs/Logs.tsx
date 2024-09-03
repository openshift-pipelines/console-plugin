import * as React from 'react';
import { Alert } from '@patternfly/react-core';
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
import './MultiStreamLogs.scss';

type LogsProps = {
  resource: PodKind;
  containers: ContainerSpec[];
  setCurrentLogsGetter?: (getter: () => string) => void;
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
  resource,
  containers,
  setCurrentLogsGetter,
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
    let ws = new WSFactory(watchURL, wsOpts);
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

  React.useEffect(() => {
    containers.forEach((container) => {
      if (activeContainers.has(container.name)) return;
      setActiveContainers((prev) => new Set(prev).add(container.name));
      let loaded = false;
      let ws: WSFactory;
      const { name } = container;
      const urlOpts = {
        ns: resNamespace,
        name: resName,
        path: 'log',
        queryParams: {
          container: name,
          follow: 'true',
          timestamps: 'true',
        },
      };
      const watchURL = resourceURL(PodModel, urlOpts);

      const containerStatus: ContainerStatus[] =
        resource?.status?.containerStatuses ?? [];
      const statusIndex = containerStatus.findIndex(
        (c) => c.name === container.name,
      );
      const resourceStatus = containerToLogSourceStatus(
        containerStatus[statusIndex],
      );

      if (resourceStatus === LOG_SOURCE_TERMINATED) {
        consoleFetchText(watchURL)
          .then((res) => {
            if (loaded) return;
            appendMessage(name, res, resourceStatus);
          })
          .catch(() => {
            if (loaded) return;
            setError(true);
          });
      } else {
        const wsOpts = {
          host: 'auto',
          path: watchURL,
          subprotocols: ['base64.binary.k8s.io'],
        };
        ws = retryWebSocket(
          watchURL,
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
      return () => {
        loaded = true;
        if (ws) {
          ws.destroy();
        }
      };
    });
  }, [
    resName,
    resNamespace,
    resource?.status?.containerStatuses,
    activeContainers,
  ]);

  React.useEffect(() => {
    const formattedString = processLogData(logData, containers);
    setFormattedLogString(formattedString);
    const totalLines = formattedString.split('\n').length;
    setScrollToRow(totalLines);
  }, [logData]);

  return (
    <div className="odc-logs-logviewer">
      {error && (
        <Alert
          variant="danger"
          isInline
          title={t('An error occurred while retrieving the requested logs.')}
        />
      )}
      <LogViewer
        hasLineNumbers={false}
        isTextWrapped={false}
        data={formattedLogString}
        theme="dark"
        scrollToRow={scrollToRow}
        height="100%"
      />
    </div>
  );
};

export default Logs;
