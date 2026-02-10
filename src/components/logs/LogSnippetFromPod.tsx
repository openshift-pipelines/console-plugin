import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '../Loading';
import { consoleFetchText } from '@openshift-console/dynamic-plugin-sdk';
import { PodModel } from '../../models';
import { resourceURL } from '../utils/k8s-utils';
import { fetchMultiClusterLogs } from '../utils/multi-cluster-api';

type LogSnippetFromPodProps = {
  children: (logSnippet: string) => React.ReactNode;
  containerName: string;
  namespace: string;
  podName: string;
  title: string;
  staticMessage?: string;
  isHub?: boolean;
  pipelineRunName?: string;
};

const LogSnippetFromPod: React.FC<LogSnippetFromPodProps> = ({
  children,
  containerName,
  namespace,
  podName,
  title,
  staticMessage,
  isHub,
  pipelineRunName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [logSnippet, setLogSnippet] = React.useState<string>(null);
  const [logError, setLogError] = React.useState<string>(null);

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        let logContent: string;
        if (isHub && pipelineRunName) {
          // Use multicluster API for hub clusters
          logContent = await fetchMultiClusterLogs(
            namespace,
            pipelineRunName,
            podName,
            containerName,
          );
          // Get last 5 lines to match tailLines behavior
          const lines = logContent.split('\n');
          logContent = lines.slice(-6).join('\n'); // -6 to account for potential trailing newline
        } else {
          // Use local k8s API
          const urlOpts = {
            ns: namespace,
            name: podName,
            path: 'log',
            queryParams: {
              container: containerName,
              tailLines: '5',
            },
          };
          const watchURL = resourceURL(PodModel, urlOpts);
          logContent = await consoleFetchText(watchURL);
        }
        setLogSnippet(logContent);
      } catch (error) {
        setLogError(error?.message || t('Unknown error retrieving logs'));
      }
    };
    fetchLogs();
  }, [containerName, namespace, podName, t, isHub, pipelineRunName]);

  if (logError) {
    return (
      <Alert isInline title={title} variant="danger">
        {staticMessage ? staticMessage : logError}
      </Alert>
    );
  }

  if (!logSnippet) {
    return <LoadingInline />;
  }

  return <>{children(logSnippet)}</>;
};

export default LogSnippetFromPod;
