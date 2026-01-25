import * as React from 'react';
import LogSnippetFromPod from './LogSnippetFromPod';
import { CombinedErrorDetails } from '../../types/log-snippet-types';

type LogSnippetBlockProps = {
  children: (logSnippet: string) => React.ReactNode;
  logDetails: CombinedErrorDetails;
  namespace: string;
  isHub?: boolean;
  pipelineRunName?: string;
};

const LogSnippetBlock: React.FC<LogSnippetBlockProps> = ({
  children,
  logDetails,
  namespace,
  isHub,
  pipelineRunName,
}) => {
  return 'podName' in logDetails ? (
    <LogSnippetFromPod
      containerName={logDetails.containerName}
      namespace={namespace}
      podName={logDetails.podName}
      title={logDetails.title}
      staticMessage={logDetails.staticMessage}
      isHub={isHub}
      pipelineRunName={pipelineRunName}
    >
      {children}
    </LogSnippetFromPod>
  ) : (
    <>{children(logDetails.staticMessage)}</>
  );
};

export default LogSnippetBlock;
