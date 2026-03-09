import type { ReactElement, FC } from 'react';
import { useState, useCallback } from 'react';
import { getParentScrollableElement } from './useScrollContainer';

type WithScrollContainerProps = {
  children: (scrollContainer: HTMLElement) => ReactElement | null;
};

export const WithScrollContainer: FC<WithScrollContainerProps> = ({
  children,
}) => {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement>();
  const ref = useCallback((node) => {
    if (node) {
      setScrollContainer(getParentScrollableElement(node));
    }
  }, []);
  return scrollContainer ? children(scrollContainer) : <span ref={ref} />;
};
