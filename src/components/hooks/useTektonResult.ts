import { Selector, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { useEffect, useState } from 'react';
import { RepositoryFields, RepositoryLabels } from '../../consts';
import { FLAGS, PipelineRunKind } from '../../types';
import { getTaskRunLog } from '../utils/tekton-results';
import { usePipelineRuns } from './useTaskRuns';

export type GetNextPage = () => void | undefined;

export const useGetPipelineRuns = (
  ns: string,
  options?: { name: string; kind: string },
): [
  PipelineRunKind[],
  boolean,
  boolean,
  Error | undefined,
  boolean,
  boolean,
] => {
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

  return usePipelineRuns(
    ns,
    selector && {
      selector,
    },
  );
};

export const useTRTaskRunLog = (
  namespace: string,
  taskRunName: string,
  taskRunPath: string,
): [string, boolean, unknown] => {
  const [result, setResult] = useState<[string, boolean, unknown]>([
    null,
    false,
    undefined,
  ]);
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);

  useEffect(() => {
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
