import * as React from 'react';
import LogSnippetFromPod from './LogSnippetFromPod';
import { CombinedErrorDetails } from '../../types/log-snippet-types';

type LogSnippetBlockProps = {
  children: (logSnippet: string) => React.ReactNode;
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const LogSnippetBlock: React.FC<LogSnippetBlockProps> = ({
  children,
  logDetails,
  namespace,
}) => {
  return 'podName' in logDetails ? (
    <LogSnippetFromPod
      containerName={logDetails.containerName}
      namespace={namespace}
      podName={logDetails.podName}
      title={logDetails.title}
      staticMessage={logDetails.staticMessage}
    >
      {children}
    </LogSnippetFromPod>
  ) : (
    <>{children(logDetails.staticMessage)}</>
  );
};

export default LogSnippetBlock;
