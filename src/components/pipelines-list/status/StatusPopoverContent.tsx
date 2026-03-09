import type { ReactNode, FC } from 'react';
import { CombinedErrorDetails } from '../../logs/log-snippet-types';
import LogSnippetBlock from '../../logs/LogSnippetBlock';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  link?: ReactNode;
  namespace: string;
  logDetails: CombinedErrorDetails;
};
const StatusPopoverContent: FC<StatusPopoverContentProps> = ({
  namespace,
  logDetails,
  link = null,
}) => {
  return (
    <div className="odc-statuspopover-content">
      <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
        {(logSnippet: string) => (
          <>
            <pre className="co-pre">{logSnippet}</pre>
            {link}
          </>
        )}
      </LogSnippetBlock>
    </div>
  );
};

export default StatusPopoverContent;
