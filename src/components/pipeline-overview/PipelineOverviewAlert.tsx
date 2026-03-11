import type { FC } from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertProps,
} from '@patternfly/react-core';

import './PipelineOverviewAlert.scss';

type PipelineOverviewAlertProps = {
  title: string;
  onClose?: () => void;
};

const PipelineOverviewAlert: FC<
  PipelineOverviewAlertProps & AlertProps
> = ({ title, onClose }) => {
  return (
    <Alert
      className="opp-pipeline-overview-alert"
      variant="custom"
      isInline
      title={title}
      actionClose={<AlertActionCloseButton onClose={onClose} />}
    />
  );
};

export default PipelineOverviewAlert;
