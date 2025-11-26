import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { useEffect, useRef } from 'react';

export const useSafeFetch = (timeout = 60000) => {
  const controller = useRef<AbortController>();
  useEffect(() => {
    return () => controller.current?.abort();
  }, []);

  return (url) => {
    if (controller.current) {
      controller.current.abort();
    }
    controller.current = new AbortController();
    return consoleFetchJSON(
      url,
      'get',
      {
        signal: controller.current.signal as AbortSignal,
      },
      timeout,
    );
  };
};
