import type { FC } from 'react';
import { observer, Node } from '@patternfly/react-topology';

const SpacerNode: FC<{ element: Node }> = () => {
  return <g />;
};

export default observer(SpacerNode);
