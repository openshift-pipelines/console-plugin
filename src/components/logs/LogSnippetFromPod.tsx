import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '../Loading';
import { consoleFetchText } from '@openshift-console/dynamic-plugin-sdk';
import { PodModel } from '../../models';
import { resourceURL } from '../utils/k8s-utils';

type LogSnippetFromPodProps = {
  children: (logSnippet: string) => React.ReactNode;
  containerName: string;
  namespace: string;
  podName: string;
  title: string;
  staticMessage?: string;
};

const LogSnippetFromPod: React.FC<LogSnippetFromPodProps> = ({
  children,
  containerName,
  namespace,
  podName,
  title,
  staticMessage,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [logSnippet, setLogSnippet] = React.useState<string>(null);
  const [logError, setLogError] = React.useState<string>(null);

  React.useEffect(() => {
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
    consoleFetchText(watchURL)
      .then((logContent: string) => {
        setLogSnippet(logContent);
      })
      .catch((error) => {
        setLogError(error?.message || t('Unknown error retrieving logs'));
      });
  }, [containerName, namespace, podName, t]);

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
