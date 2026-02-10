import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { PodKind, TaskRunKind } from '../../types';

const PROXY_BASE = '/api/proxy/plugin/pipelines-console-plugin/multicluster';

export type ResolveResponse = {
  name: string;
  state: string;
  workloadName: string;
};

export type TaskRunsResponse = { items: TaskRunKind[] };
export type PodsResponse = { items: PodKind[] };

/* export const resolveWorkerCluster = (
  ns: string,
  plrName: string,
): Promise<ResolveResponse> =>
  consoleFetchJSON(
    `${PROXY_BASE}/api/v1/namespaces/${ns}/pipelineruns/${plrName}/resolve`,
  ); */

export const getMultiClusterTaskRuns = (
  ns: string,
  plrName: string,
): Promise<TaskRunsResponse> =>
  consoleFetchJSON(
    `${PROXY_BASE}/api/v1/namespaces/${ns}/pipelineruns/${plrName}/taskruns`,
  );

export const getMultiClusterPods = (
  ns: string,
  plrName: string,
): Promise<PodsResponse> =>
  consoleFetchJSON(
    `${PROXY_BASE}/api/v1/namespaces/${ns}/pipelineruns/${plrName}/pods`,
  );

// Not using this as this only returns the Pod status, and we need the full Pod for container info
export const getMultiClusterPodStatus = (
  ns: string,
  podName: string,
  plrName: string,
): Promise<PodKind> =>
  consoleFetchJSON(
    `${PROXY_BASE}/api/v1/namespaces/${ns}/pods/${podName}/status?pipelineRun=${plrName}`,
  );

export const fetchMultiClusterLogs = async (
  ns: string,
  plrName: string,
  podName: string,
  container: string,
): Promise<string> => {
  const res = await fetch(
    `${PROXY_BASE}/api/v1/namespaces/${ns}/logs?pipelineRun=${plrName}&pod=${podName}&container=${container}`,
  );
  return res.text();
};

export const getMultiClusterLogsUrl = (
  ns: string,
  plrName: string,
  podName: string,
  container: string,
): string =>
  `${PROXY_BASE}/api/v1/namespaces/${ns}/logs?pipelineRun=${plrName}&pod=${podName}&container=${container}`;

// Returns just the path for use with WSFactory
export const getMultiClusterLogsStreamPath = (
  ns: string,
  plrName: string,
  podName: string,
  container: string,
): string =>
  `${PROXY_BASE}/api/v1/namespaces/${ns}/logs/stream?pipelineRun=${plrName}&pod=${podName}&container=${container}`;

export const checkReady = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${PROXY_BASE}/ready`);
    return res.ok;
  } catch {
    return false;
  }
};
