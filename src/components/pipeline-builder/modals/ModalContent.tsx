import type { ReactNode, FC } from 'react';
import { Split, SplitItem } from '@patternfly/react-core';

import './ModalContent.scss';

type ModalContentProps = {
  icon?: ReactNode;
  title: string;
  message: string;
};

const ModalContent: FC<ModalContentProps> = ({
  icon,
  message,
  title,
}) => {
  return (
    <Split className="odc-modal-content" hasGutter>
      {icon && <SplitItem className='odc-modal-content__confirm-title'>{icon}</SplitItem>}
      <SplitItem isFilled>
        <h2 className="co-break-word odc-modal-content__confirm-title">
          {title}
        </h2>
        <p className="co-break-word">{message}</p>
      </SplitItem>
    </Split>
  );
};

export default ModalContent;
