import { UseURLPoll } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { useCallback, useState } from 'react';
import { usePoll } from './poll-hook';
import { useSafeFetch } from './safe-fetch-hook';

export const URL_POLL_DEFAULT_DELAY = 15000; // 15 seconds

export const useURLPoll: UseURLPoll = <R>(
  url: string,
  delay = URL_POLL_DEFAULT_DELAY,
  timeout?: number,
  ...dependencies: any[]
) => {
  const [error, setError] = useState();
  const [response, setResponse] = useState<R>();
  const [loading, setLoading] = useState(true);
  const safeFetch = useSafeFetch(timeout);

  const handleReset = () => {
    setResponse(null);
    setError(null);
  };

  const tick = useCallback(() => {
    if (url) {
      handleReset();
      setLoading(true);
      safeFetch(url)
        .then((data) => {
          setResponse(data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setResponse(null);
          if (err.name !== 'AbortError') {
            // eslint-disable-next-line no-console
            console.error(`Error polling useURLPoll: ${url} - ${err}`);
            setLoading(false);
          }
        });
    } else {
      handleReset();
      setLoading(false);
    }
  }, [url]);

  usePoll(tick, delay, ...dependencies);

  return [response, error, loading];
};
