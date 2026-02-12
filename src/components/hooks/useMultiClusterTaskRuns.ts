import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';

import {
  checkReady,
  getMultiClusterTaskRuns,
} from '../utils/multi-cluster-api';

type MultiClusterState<Kind> = {
  data: Kind[];
  loaded: boolean;
  error: unknown;
  pendingAdmission: boolean;
  proxyUnavailable: boolean;
};

type UseMultiClusterTaskRunsResult<Kind> = [
  Kind[], // data
  boolean, // loaded
  unknown, // error
  boolean, // pendingAdmission
  boolean, // proxyUnavailable
];

/**
 * Hook for fetching TaskRuns from multi-cluster API on hub clusters.
 * Handles polling while PipelineRun is in progress and pending admission state.
 *
 * @param namespace - The namespace to fetch TaskRuns from
 * @param pipelineRunName - The PipelineRun name to filter TaskRuns
 * @param isResourceManagedByKueue - Whether this is a hub cluster
 * @param pipelineRunFinished - Whether the PipelineRun has finished (stops polling)
 */
export const useMultiClusterTaskRuns = <Kind extends K8sResourceCommon>(
  namespace: string | null,
  pipelineRunName: string | null,
  isResourceManagedByKueue: boolean,
  pipelineRunFinished?: boolean,
): UseMultiClusterTaskRunsResult<Kind> => {
  const [state, setState] = React.useState<MultiClusterState<Kind>>({
    data: [],
    loaded: false,
    error: null,
    pendingAdmission: false,
    proxyUnavailable: false,
  });

  // Track if proxy readiness has been checked
  const proxyCheckedRef = React.useRef(false);
  const proxyReadyRef = React.useRef(false);

  // Track mounted state to avoid state updates after unmount
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch TaskRuns (called after proxy is confirmed ready)
  const fetchTaskRuns = React.useCallback(async () => {
    if (!namespace || !pipelineRunName) return;

    try {
      const response = await getMultiClusterTaskRuns(
        namespace,
        pipelineRunName,
      );
      if (mountedRef.current) {
        setState({
          data: (response?.items || []) as unknown as Kind[],
          loaded: true,
          error: null,
          pendingAdmission: false,
          proxyUnavailable: false,
        });
      }
    } catch (e: unknown) {
      const err = e as { status?: number; response?: { status?: number } };
      const status = err?.status || err?.response?.status;

      if (mountedRef.current) {
        if (status === 409) {
          setState({
            data: [],
            loaded: true,
            error: null,
            pendingAdmission: true,
            proxyUnavailable: false,
          });
        } else {
          setState({
            data: [],
            loaded: true,
            error: e,
            pendingAdmission: false,
            proxyUnavailable: false,
          });
        }
      }
    }
  }, [namespace, pipelineRunName]);

  // Should we fetch from multi-cluster API?
  const shouldFetch = isResourceManagedByKueue && !!namespace && !!pipelineRunName;

  // Should we continue polling after initial fetch?
  const shouldContinuePolling =
    shouldFetch &&
    !state.proxyUnavailable &&
    (!pipelineRunFinished || state.pendingAdmission);

  /* Checks proxy readiness once, then starts polling for TaskRuns.
  
  Manual polling is used instead of usePoll because initialization must be sequential:
  1) Perform a one-time async proxy readiness check
  2) Start polling only after the proxy is confirmed ready
  
  usePoll runs immediately on mount, which could race with the async proxy check and trigger fetchTaskRuns before proxyReady is set so using manual polling instead. */
  React.useEffect(() => {
    if (!shouldFetch) {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loaded: true }));
      }
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startPolling = async () => {
      // Check proxy readiness only once
      if (!proxyCheckedRef.current) {
        proxyCheckedRef.current = true;
        try {
          const isReady = await checkReady();
          if (!isReady) {
            proxyReadyRef.current = false;
            if (mountedRef.current) {
              setState({
                data: [],
                loaded: true,
                error: null,
                pendingAdmission: false,
                proxyUnavailable: true,
              });
            }
            return;
          }
          proxyReadyRef.current = true;
        } catch {
          proxyReadyRef.current = false;
          if (mountedRef.current) {
            setState({
              data: [],
              loaded: true,
              error: null,
              pendingAdmission: false,
              proxyUnavailable: true,
            });
          }
          return;
        }
      }

      // If proxy wasn't ready from a previous check, don't continue
      if (!proxyReadyRef.current) return;

      // Poll for TaskRuns
      const poll = async () => {
        if (cancelled) return;
        await fetchTaskRuns();
        if (!cancelled && shouldContinuePolling) {
          timeoutId = setTimeout(poll, 3000);
        }
      };

      poll();
    };

    startPolling();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shouldFetch, shouldContinuePolling, fetchTaskRuns]);

  return [
    state.data,
    state.loaded,
    state.error,
    state.pendingAdmission,
    state.proxyUnavailable,
  ];
};
