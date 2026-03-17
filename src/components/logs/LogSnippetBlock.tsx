import type { ReactNode, FC } from 'react';
import LogSnippetFromPod from './LogSnippetFromPod';
import { CombinedErrorDetails } from '../../types/log-snippet-types';

type LogSnippetBlockProps = {
  children: (logSnippet: string) => ReactNode;
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const LogSnippetBlock: FC<LogSnippetBlockProps> = ({
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
