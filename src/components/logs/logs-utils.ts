import {
  consoleFetchText,
  k8sGet,
} from '@openshift-console/dynamic-plugin-sdk';
import { saveAs } from 'file-saver';
import { LOG_SOURCE_TERMINATED, LOG_SOURCE_WAITING } from '../../consts';
import { PodModel } from '../../models';
import {
  ContainerSpec,
  ContainerStatus,
  PodKind,
  TaskRunKind,
} from '../../types';
import { errorModal } from '../modals/error-modal';
import { t } from '../utils/common-utils';
import { resourceURL } from '../utils/k8s-utils';
import {
  fetchMultiClusterLogs,
  getMultiClusterPods,
} from '../utils/multi-cluster-api';
import { containerToLogSourceStatus } from '../utils/pipeline-utils';
import { getTaskRunLog } from '../utils/tekton-results';
import { LineBuffer } from './line-buffer';

const getSortedContainerStatus = (
  containers: ContainerSpec[],
  containerStatuses: ContainerStatus[],
): ContainerStatus[] => {
  const containerNames = containers.map((c) => c.name);
  const sortedContainerStatus = [];
  containerStatuses.forEach((cs) => {
    const containerIndex = containerNames.indexOf(cs.name);
    sortedContainerStatus[containerIndex] = cs;
  });
  return sortedContainerStatus;
};

export const getRenderContainers = (
  pod: PodKind,
): { containers: ContainerSpec[]; stillFetching: boolean } => {
  const containers: ContainerSpec[] = pod?.spec?.containers ?? [];
  const containerStatuses: ContainerStatus[] =
    pod?.status?.containerStatuses ?? [];

  const sortedContainerStatuses = getSortedContainerStatus(
    containers,
    containerStatuses,
  );

  const firstRunningCont = sortedContainerStatuses.findIndex(
    (container) =>
      containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
  );
  return {
    containers: containers.slice(
      0,
      firstRunningCont === -1 ? containers.length : firstRunningCont + 1,
    ),
    stillFetching: firstRunningCont !== -1,
  };
};

const getOrderedStepsFromPod = (
  name: string,
  ns: string,
): Promise<ContainerStatus[]> => {
  return k8sGet({ model: PodModel, name, ns })
    .then((pod: PodKind) => {
      return getSortedContainerStatus(
        pod.spec.containers ?? [],
        pod.status?.containerStatuses ?? [],
      );
    })
    .catch((err) => {
      errorModal({
        error: err.message || t('Error downloading logs.'),
      });
      return [];
    });
};

type StepsWatchUrl = {
  [key: string]: {
    name: string;
    steps: { [step: string]: WatchURLStatus };
    taskRunPath: string;
  };
};

type WatchURLStatus = {
  status: string;
  url: string;
};

export const getDownloadAllLogsCallback = (
  sortedTaskRunNames: string[],
  taskRuns: TaskRunKind[],
  namespace: string,
  pipelineRunName: string,
  isDevConsoleProxyAvailable?: boolean,
): (() => Promise<Error | null>) => {
  const getWatchUrls = async (): Promise<StepsWatchUrl> => {
    const stepsList: ContainerStatus[][] = await Promise.all(
      sortedTaskRunNames.map((currTask) => {
        const { status } =
          taskRuns.find((t) => t.metadata.name === currTask) ?? {};
        return getOrderedStepsFromPod(status?.podName, namespace);
      }),
    );
    return sortedTaskRunNames.reduce((acc, currTask, i) => {
      const taskRun = taskRuns.find((t) => t.metadata.name === currTask);
      const pipelineTaskName =
        taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
      const { status } = taskRun;
      const podName = status?.podName;
      const steps = stepsList[i];
      const allStepUrls = steps.reduce((stepUrls, currentStep) => {
        const { name } = currentStep;
        const currentStatus = containerToLogSourceStatus(currentStep);
        if (currentStatus === LOG_SOURCE_WAITING) return stepUrls;
        const urlOpts = {
          ns: namespace,
          name: podName,
          path: 'log',
          queryParams: {
            container: name,
            follow: 'true',
            timestamps: 'true',
          },
        };
        return {
          ...stepUrls,
          [name]: {
            status: currentStatus,
            url: resourceURL(PodModel, urlOpts),
          } as WatchURLStatus,
        };
      }, {});
      acc[currTask] = {
        name: pipelineTaskName,
        steps: { ...allStepUrls },
        taskRunPath:
          taskRun.metadata?.annotations?.['results.tekton.dev/record'],
      };
      return acc;
    }, {});
  };

  const fetchLogs = async (tasksPromise: Promise<StepsWatchUrl>) => {
    const tasks = await tasksPromise;
    let allLogs = '';
    for (const currTask of sortedTaskRunNames) {
      const task = tasks[currTask];
      const steps = Object.keys(task.steps);
      allLogs += `${task.name}\n\n`;
      if (steps.length > 0) {
        for (const step of steps) {
          const { url, status } = task.steps[step];
          const getContentPromise = consoleFetchText(url).then((logs) => {
            return `${step.toUpperCase()}\n\n${logs}\n\n`;
          });
          allLogs +=
            status === LOG_SOURCE_TERMINATED
              ? // If we are done, we want this log content
                // eslint-disable-next-line no-await-in-loop
                await getContentPromise
              : // If we are not done, let's not wait indefinitely
                // eslint-disable-next-line no-await-in-loop
                await Promise.race([
                  getContentPromise,
                  new Promise<string>((resolve) => {
                    setTimeout(() => resolve(''), 1000);
                  }),
                ]);
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        allLogs += await getTaskRunLog(
          task.taskRunPath,
          isDevConsoleProxyAvailable,
        ).then((log) => `${tasks[currTask].name.toUpperCase()}\n\n${log}\n\n`);
      }
    }
    const buffer = new LineBuffer(null);
    buffer.ingest(allLogs);
    const blob = buffer.getBlob({
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${pipelineRunName}.log`);
    return null;
  };
  return (): Promise<Error | null> => {
    return fetchLogs(getWatchUrls());
  };
};

/* Leaving it as is for now, we can and probably should refactor this a bit */
export const getDownloadAllLogsCallbackMultiCluster = (
  sortedTaskRunNames: string[],
  taskRuns: TaskRunKind[],
  namespace: string,
  pipelineRunName: string,
  isDevConsoleProxyAvailable?: boolean,
): (() => Promise<Error | null>) => {
  const fetchMcLogs = async (): Promise<Error | null> => {
    let allLogs = '';

    // Get all pods from multi-cluster API (or fall back on error)
    let pods: PodKind[] = [];
    try {
      const podsResponse = await getMultiClusterPods(
        namespace,
        pipelineRunName,
      );
      pods = podsResponse?.items || [];
    } catch (err) {
      console.warn(
        'Multi-cluster pods API failed in the Pipelines Operator:',
        err,
      );
    }

    for (const currTask of sortedTaskRunNames) {
      const taskRun = taskRuns.find((t) => t.metadata.name === currTask);
      if (!taskRun) continue;

      const pipelineTaskName =
        taskRun.spec?.taskRef?.name ?? taskRun.metadata.name;
      const podName = taskRun.status?.podName;

      allLogs += `${pipelineTaskName}\n\n`;

      if (!podName) {
        allLogs += 'No pod found for this task\n\n';
        continue;
      }

      const pod = pods.find((p) => p.metadata?.name === podName);
      const containers: ContainerSpec[] = pod?.spec?.containers ?? [];
      const containerStatuses: ContainerStatus[] =
        pod?.status?.containerStatuses ?? [];

      // Fallback to Tekton Results if pod/containers are missing
      if (containers.length === 0) {
        const taskRunPath =
          taskRun.metadata?.annotations?.['results.tekton.dev/record'];

        if (taskRunPath) {
          try {
            const log = await getTaskRunLog(
              taskRunPath,
              isDevConsoleProxyAvailable,
            );
            allLogs += `${log}\n\n`;
          } catch (trErr) {
            allLogs += `Error fetching logs from Tekton Results: ${
              (trErr as Error).message
            }\n\n`;
          }
        } else {
          allLogs +=
            'No containers found and no Tekton Results path available\n\n';
        }
        continue;
      }

      for (const container of containers) {
        const containerStatus = containerStatuses.find(
          (cs) => cs.name === container.name,
        );
        const currentStatus = containerToLogSourceStatus(containerStatus);

        if (currentStatus === LOG_SOURCE_WAITING) continue;

        try {
          const getContentPromise = fetchMultiClusterLogs(
            namespace,
            pipelineRunName,
            podName,
            container.name,
          ).then((logs) => `${container.name.toUpperCase()}\n\n${logs}\n\n`);

          allLogs +=
            currentStatus === LOG_SOURCE_TERMINATED
              ? await getContentPromise
              : await Promise.race([
                  getContentPromise,
                  new Promise<string>((resolve) =>
                    setTimeout(() => resolve(''), 1000),
                  ),
                ]);
        } catch (err) {
          const taskRunPath =
            taskRun.metadata?.annotations?.['results.tekton.dev/record'];

          if (taskRunPath) {
            try {
              const log = await getTaskRunLog(
                taskRunPath,
                isDevConsoleProxyAvailable,
              );
              allLogs += `${container.name.toUpperCase()}\n\n${log}\n\n`;
            } catch (trErr) {
              allLogs += `${container.name.toUpperCase()}\n\nError fetching logs (multi-cluster: ${
                (err as Error).message
              }, Tekton Results: ${(trErr as Error).message})\n\n`;
            }
          } else {
            allLogs += `${container.name.toUpperCase()}\n\nError fetching logs: ${
              (err as Error).message
            }\n\n`;
          }
        }
      }
    }

    const buffer = new LineBuffer(null);
    buffer.ingest(allLogs);

    const blob = buffer.getBlob({
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${pipelineRunName}.log`);
    return null;
  };

  return () => fetchMcLogs();
};
