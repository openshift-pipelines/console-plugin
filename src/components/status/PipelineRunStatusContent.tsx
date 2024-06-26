import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import PipelineResourceStatus from './PipelineResourceStatus';
import PipelineRunStatusPopoverContent from './PipelineRunStatusPopoverContent';
import { ComputedStatus, PipelineRunKind } from '../../types';

import './PipelineRunStatusContent.scss';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRunKind;
  title?: string;
};
const PipelineRunStatusContent: React.FC<PipelineRunStatusProps> = ({
  status,
  pipelineRun,
  title,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const PopoverContent = () => {
    return (
      <>
        {isPopoverOpen && (
          <PipelineRunStatusPopoverContent pipelineRun={pipelineRun} />
        )}
      </>
    );
  };
  return (
    <>
      {pipelineRun ? (
        status === ComputedStatus.Failed ? (
          <Popover
            bodyContent={PopoverContent}
            isVisible={isPopoverOpen}
            shouldClose={() => setIsPopoverOpen(false)}
            shouldOpen={() => setIsPopoverOpen(true)}
            position={PopoverPosition.auto}
          >
            <Button variant="plain" className="odc-status-column-text">
              <PipelineResourceStatus status={status} title={title} />
            </Button>
          </Popover>
        ) : (
          <PipelineResourceStatus status={status} title={title} />
        )
      ) : (
        <>{'-'}</>
      )}
    </>
  );
};

export default PipelineRunStatusContent;
