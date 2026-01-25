import * as React from 'react';
import { CombinedErrorDetails } from '../../logs/log-snippet-types';
import LogSnippetBlock from '../../logs/LogSnippetBlock';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  link?: React.ReactNode;
  namespace: string;
  logDetails: CombinedErrorDetails;
  isHub?: boolean;
  pipelineRunName?: string;
};
const StatusPopoverContent: React.FC<StatusPopoverContentProps> = ({
  namespace,
  logDetails,
  link = null,
  isHub,
  pipelineRunName,
}) => {
  return (
    <div className="odc-statuspopover-content">
      <LogSnippetBlock
        logDetails={logDetails}
        namespace={namespace}
        isHub={isHub}
        pipelineRunName={pipelineRunName}
      >
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
