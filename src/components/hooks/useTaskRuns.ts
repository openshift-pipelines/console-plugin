import {
  Selector,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import {
  ApprovalFields,
  ApprovalLabels,
  TektonResourceLabel,
} from '../../consts';
import { ApprovalTaskModel } from '../../models';
import { ApprovalTaskKind, TaskRunKind } from '../../types';

export const getTaskRunsOfPipelineRun = (
  taskRuns: TaskRunKind[],
  pipelineRunName: string,
): TaskRunKind[] => {
  return taskRuns.filter(
    (taskRun) =>
      taskRun.metadata?.labels[TektonResourceLabel.pipelinerun] ===
      pipelineRunName,
  );
};

export const useApprovalTasks = (
  namespace: string,
  pipelineRunName?: string,
): [ApprovalTaskKind[], boolean, any] => {
  const selector: Selector = React.useMemo(() => {
    if (pipelineRunName) {
      return {
        matchLabels: {
          [ApprovalLabels[ApprovalFields.PIPELINE_RUN]]: pipelineRunName,
        },
      };
    }
    return undefined;
  }, [pipelineRunName]);
  const watchedResource = React.useMemo(
    () => ({
      isList: true,
      groupVersionKind: {
        group: ApprovalTaskModel.apiGroup,
        kind: ApprovalTaskModel.kind,
        version: ApprovalTaskModel.apiVersion,
      },
      namespace,
      namespaced: true,
      ...(selector && { selector }),
    }),
    [namespace],
  );

  return useK8sWatchResource<ApprovalTaskKind[]>(watchedResource);
};
