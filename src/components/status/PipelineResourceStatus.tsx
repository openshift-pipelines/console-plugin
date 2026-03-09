import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import type { ReactNode, FC } from 'react';
import { Children } from 'react';

type PipelineResourceStatusProps = {
  status: string;
  children?: ReactNode;
  title?: string;
};
const PipelineResourceStatus: FC<PipelineResourceStatusProps> = ({
  status,
  children,
  title,
}) => (
  <Status status={status} title={title}>
    {status === 'Failed' &&
      Children.toArray(children).length > 0 &&
      children}
  </Status>
);

export default PipelineResourceStatus;
