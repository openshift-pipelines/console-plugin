import {
  K8sGroupVersionKind,
  K8sResourceCommon,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { useEffect, useRef, useState } from 'react';
import { FLAGS, TektonResultsOptions } from '../../types';
import { useDeepCompareMemoize } from '../utils/common-utils';
import { fetchAllTektonResultsPages } from '../utils/tekton-results';

export const useTRRuns = <Kind extends K8sResourceCommon>(
  namespace: string,
  groupVersionKind: K8sGroupVersionKind,
  options?: TektonResultsOptions,
  isTektonResultEnabled?: boolean,
  skipFetch?: boolean,
): [Kind[], boolean, Error | undefined] => {
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const fetchedRef = useRef(false);
  const [results, setResults] = useState<[Kind[], boolean, Error | undefined]>([
    [],
    false,
    undefined,
  ]);
  const stableOptions = useDeepCompareMemoize(options);
  const stableGVK = useDeepCompareMemoize(groupVersionKind);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const generator = fetchAllTektonResultsPages<Kind>(
          namespace,
          stableGVK,
          isDevConsoleProxyAvailable,
          '',
          stableOptions,
        );
        for await (const data of generator) {
          if (fetchedRef.current) break;
          setResults([data, true, undefined]);
        }
        if (!fetchedRef.current) {
          fetchedRef.current = true;
        }
      } catch (e) {
        if (!fetchedRef.current) {
          fetchedRef.current = true;
          setResults([[], true, e]);
        }
      }
    };
    !skipFetch && isTektonResultEnabled && fetchResults();
    return () => {
      fetchedRef.current = false;
    };
  }, [
    namespace,
    stableGVK,
    isDevConsoleProxyAvailable,
    stableOptions,
    skipFetch,
    isTektonResultEnabled,
  ]);
  if (!isTektonResultEnabled) {
    return [[], true, undefined];
  }
  return results;
};
