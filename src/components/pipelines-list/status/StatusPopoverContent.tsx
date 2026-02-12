import * as React from 'react';
import { CombinedErrorDetails } from '../../logs/log-snippet-types';
import LogSnippetBlock from '../../logs/LogSnippetBlock';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  link?: React.ReactNode;
  namespace: string;
  logDetails: CombinedErrorDetails;
  isResourceManagedByKueue?: boolean;
  pipelineRunName?: string;
};
const StatusPopoverContent: React.FC<StatusPopoverContentProps> = ({
  namespace,
  logDetails,
  link = null,
  isResourceManagedByKueue,
  pipelineRunName,
}) => {
  return (
    <div className="odc-statuspopover-content">
      <LogSnippetBlock
        logDetails={logDetails}
        namespace={namespace}
        isResourceManagedByKueue={isResourceManagedByKueue}
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
