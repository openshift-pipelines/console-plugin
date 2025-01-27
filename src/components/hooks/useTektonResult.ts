import {
  K8sResourceCommon,
  Selector,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { uniqBy } from 'lodash';
import * as React from 'react';
import {
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
  RepositoryFields,
  RepositoryLabels,
  TektonResourceLabel,
} from '../../consts';
import {
  FLAGS,
  PipelineRunKind,
  RecordsList,
  TaskRunKind,
  TektonResultsOptions,
} from '../../types';
import {
  getPipelineRuns,
  getTaskRunLog,
  getTaskRuns,
} from '../utils/tekton-results';
import { usePipelineRuns, useTaskRuns } from './useTaskRuns';

export type GetNextPage = () => void | undefined;

const useTRRuns = <Kind extends K8sResourceCommon>(
  getRuns: (
    namespace: string,
    options?: TektonResultsOptions,
    nextPageToken?: string,
    cacheKey?: string,
    isDevConsoleProxyAvailable?: boolean,
  ) => Promise<[Kind[], RecordsList, boolean?]>,
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [Kind[], boolean, unknown, GetNextPage] => {
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [nextPageToken, setNextPageToken] = React.useState<string>(null);
  const [localCacheKey, setLocalCacheKey] = React.useState(cacheKey);

  if (cacheKey !== localCacheKey) {
    // force update local cache key
    setLocalCacheKey(cacheKey);
  }

  const [result, setResult] = React.useState<
    [Kind[], boolean, unknown, GetNextPage]
  >([[], false, undefined, undefined]);

  // reset token if namespace or options change
  React.useEffect(() => {
    setNextPageToken(null);
  }, [namespace, options, cacheKey]);

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const tkPipelineRuns = await getRuns(
          namespace,
          options,
          nextPageToken,
          localCacheKey,
          isDevConsoleProxyAvailable,
        );
        if (!disposed) {
          const token = tkPipelineRuns[1].nextPageToken;
          const callInflight = !!tkPipelineRuns?.[2];
          const loaded = !callInflight;
          if (!callInflight) {
            setResult((cur) => [
              nextPageToken
                ? [...cur[0], ...tkPipelineRuns[0]]
                : tkPipelineRuns[0],
              loaded,
              undefined,
              token
                ? (() => {
                    // ensure we can only call this once
                    let executed = false;
                    return () => {
                      if (!disposed && !executed) {
                        executed = true;
                        // trigger the update
                        setNextPageToken(token);
                        return true;
                      }
                      return false;
                    };
                  })()
                : undefined,
            ]);
          }
        }
      } catch (e) {
        if (!disposed) {
          if (nextPageToken) {
            setResult((cur) => [cur[0], cur[1], e, undefined]);
          } else {
            setResult([[], false, e, undefined]);
          }
        }
      }
    })();
    return () => {
      disposed = true;
    };
  }, [namespace, options, nextPageToken, localCacheKey, getRuns]);
  return result;
};

export const useTRPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [PipelineRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns<PipelineRunKind>(getPipelineRuns, namespace, options, cacheKey);

export const useTRTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns<TaskRunKind>(getTaskRuns, namespace, options, cacheKey);

export const useGetPipelineRuns = (
  ns: string,
  options?: { name: string; kind: string },
): [PipelineRunKind[], boolean, unknown, GetNextPage] => {
  let selector: Selector;

  if (options?.kind === 'Pipeline') {
    selector = { matchLabels: { 'tekton.dev/pipeline': options?.name } };
  }
  if (options?.kind === 'Repository') {
    selector = {
      matchLabels: {
        [RepositoryLabels[RepositoryFields.REPOSITORY]]: options?.name,
      },
    };
  }

  const [pipelineRuns, loaded, error, getNextPage] = usePipelineRuns(
    ns,
    selector && {
      selector,
    },
  );

  return React.useMemo(
    () => [pipelineRuns, loaded, error, getNextPage],
    [pipelineRuns, loaded, error, getNextPage],
  );
};

export const useGetTaskRuns = (
  ns: string,
  pipelineRunName?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] => {
  let selector: Selector;
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);

  if (pipelineRunName) {
    selector = {
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
      },
    };
  }
  const [k8sTaskRuns, k8sTaskRunsLoaded, k8sTaskRunsLoadError] = useTaskRuns(
    ns,
    pipelineRunName,
  );
  const [
    resultTaskRuns,
    resultTaskRunsLoaded,
    resultTaskRunsLoadError,
    getNextPage,
  ] = isTektonResultEnabled
    ? useTRTaskRuns(
        ns,
        pipelineRunName && {
          selector,
        },
      )
    : [[], true, undefined, undefined];

  const mergedTaskRuns =
    resultTaskRunsLoaded || k8sTaskRunsLoaded
      ? uniqBy([...k8sTaskRuns, ...resultTaskRuns], (r) => r.metadata.uid)
      : [];
  return [
    mergedTaskRuns,
    resultTaskRunsLoaded || k8sTaskRunsLoaded,
    k8sTaskRunsLoadError || resultTaskRunsLoadError,
    getNextPage,
  ];
};

export const useTRTaskRunLog = (
  namespace: string,
  taskRunName: string,
  taskRunPath: string,
): [string, boolean, unknown] => {
  const [result, setResult] = React.useState<[string, boolean, unknown]>([
    null,
    false,
    undefined,
  ]);
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);

  React.useEffect(() => {
    let disposed = false;
    if (namespace && taskRunName) {
      (async () => {
        try {
          const log = await getTaskRunLog(
            taskRunPath,
            isDevConsoleProxyAvailable,
          );
          if (!disposed) {
            setResult([log, true, undefined]);
          }
        } catch (e) {
          if (!disposed) {
            setResult([null, false, e]);
          }
        }
      })();
    }
    return () => {
      disposed = true;
    };
  }, [namespace, taskRunName]);
  return result;
};
