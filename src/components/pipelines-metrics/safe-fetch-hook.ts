import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { useEffect, useRef } from 'react';

export const useSafeFetch = () => {
  const controller = useRef<AbortController>();
  useEffect(() => {
    controller.current = new AbortController();
    return () => controller.current.abort();
  }, []);

  return (url) =>
    consoleFetchJSON(url, 'get', {
      signal: controller.current.signal as AbortSignal,
    });
};
