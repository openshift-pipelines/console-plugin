import type { FC } from 'react';
import { observer, Node } from '@patternfly/react-topology';
import LoadingTask from './LoadingTask';

const LoadingNode: FC<{ element: Node }> = ({ element }) => {
  const { height, width } = element.getBounds();
  const {
    task: { name },
  } = element.getData();

  return <LoadingTask {...{ width, height, name }} />;
};

export default observer(LoadingNode);
