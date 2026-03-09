import { useMemo, useEffect, useState, useCallback } from 'react';

export const useResizeObserver = (
  callback: ResizeObserverCallback,
  targetElement?: HTMLElement | null,
): void => {
  const element = useMemo(
    () => targetElement ?? document.querySelector('body'),
    [targetElement],
  );
  useEffect(() => {
    const observer = new ResizeObserver(callback);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [callback, element]);
};
export enum Shadows {
  none = 'none',
  both = 'both',
  top = 'top',
  bottom = 'bottom',
}

export const useScrollShadows = (node: HTMLElement): Shadows => {
  const [shadows, setShadows] = useState(Shadows.none);
  const computeShadows = useCallback(() => {
    if (node) {
      const { scrollTop, clientHeight, scrollHeight } = node;
      const top = scrollTop !== 0;
      const bottom = scrollTop + clientHeight < scrollHeight;
      if (top && bottom) {
        setShadows(Shadows.both);
      } else if (top) {
        setShadows(Shadows.top);
      } else if (bottom) {
        setShadows(Shadows.bottom);
      } else {
        setShadows(Shadows.none);
      }
    }
  }, [node]);
  // recompute when the scroll container changes in size
  useResizeObserver(computeShadows, node);
  useEffect(() => {
    if (node) {
      // compute initial shadows
      computeShadows();
      // listen for scroll events
      node.addEventListener('scroll', computeShadows);
    }
    return () => {
      if (node) {
        node.removeEventListener('scroll', computeShadows);
      }
    };
  }, [node, computeShadows]);
  return shadows;
};
