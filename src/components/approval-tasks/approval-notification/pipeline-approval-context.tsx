import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  WatchK8sResource,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import ApprovalToastContent from './ApprovalToastContent';
import { ApprovalStatus, ApprovalTaskKind } from '../../../types';
import { ApprovalTaskModel } from '../../../models';
import { ApprovalLabels, ApprovalFields } from '../../../consts';
import { useToast } from '../../toast/useToast';
import { useGetActiveUser } from '../../hooks/hooks';

const getPipelineRunsofApprovals = (
  approvalTasks: ApprovalTaskKind[],
): string[] => {
  const pipelineRuns = [];
  approvalTasks.forEach((approvalTask) => {
    const pipelineRunName =
      approvalTask?.metadata?.labels?.[
        ApprovalLabels[ApprovalFields.PIPELINE_RUN]
      ];
    pipelineRuns.push(pipelineRunName);
  });
  return pipelineRuns;
};

const checkUserIsApprover = (
  approvalTask: ApprovalTaskKind,
  username: string,
): boolean => {
  const approverList = approvalTask?.status?.approvers ?? [];
  return approverList?.includes(username);
};

export const PipelineApprovalContext = React.createContext({});

export const PipelineApprovalContextProvider = PipelineApprovalContext.Provider;

export const usePipelineApprovalToast = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { addToast, removeToast } = useToast();
  const [namespace] = useActiveNamespace();
  const currentUser = useGetActiveUser();
  const [currentToasts, setCurrentToasts] = React.useState<{
    [key: string]: { toastId: string };
  }>({});
  const devconsolePath = `/dev-pipelines/ns/${namespace}/approvals?rowFilter-status=pending`;
  const adminconsolePath = `pipelines/all-namespaces/approvals?rowFilter-status=pending`;

  const approvalsResource: WatchK8sResource = {
    groupVersionKind: getGroupVersionKindForModel(ApprovalTaskModel),
    isList: true,
  };
  const [approvalTasks] =
    useK8sWatchResource<ApprovalTaskKind[]>(approvalsResource);

  React.useEffect(() => {
    if (currentToasts?.current?.toastId) {
      removeToast(currentToasts.current.toastId);
      setCurrentToasts((toasts) => ({ ...toasts, current: { toastId: '' } }));
    }
    if (currentToasts?.other?.toastId) {
      removeToast(currentToasts.other.toastId);
      setCurrentToasts((toasts) => ({ ...toasts, other: { toastId: '' } }));
    }
  }, [approvalTasks, currentUser, t, addToast, removeToast]);

  React.useEffect(() => {
    let toastID = '';
    const userApprovalTasksInWait = approvalTasks.filter(
      (approvalTask) =>
        checkUserIsApprover(approvalTask, currentUser) &&
        approvalTask?.status?.state === ApprovalStatus.RequestSent,
    );

    const [currentNsApprovalTasks, otherNsApprovalTasks]: [
      ApprovalTaskKind[],
      ApprovalTaskKind[],
    ] = userApprovalTasksInWait.reduce(
      (acc, approvalTask) => {
        approvalTask?.metadata?.namespace === namespace
          ? acc[0].push(approvalTask)
          : acc[1].push(approvalTask);
        return acc;
      },
      [[], []],
    );

    if (currentNsApprovalTasks.length > 0) {
      const uniquePipelineRuns = new Set(
        getPipelineRunsofApprovals(currentNsApprovalTasks),
      ).size;

      if (uniquePipelineRuns > 0) {
        toastID = addToast({
          variant: AlertVariant.custom,
          title: t('Task approval required'),
          content: (
            <ApprovalToastContent
              type="current"
              uniquePipelineRuns={uniquePipelineRuns}
              devconsolePath={devconsolePath}
            />
          ),
          timeout: 25000,
          dismissible: true,
        }) as any;
      }
      setCurrentToasts((toasts) => ({
        ...toasts,
        current: { toastId: toastID },
      }));
    }

    if (otherNsApprovalTasks.length > 0) {
      const uniquePipelineRuns = new Set(
        getPipelineRunsofApprovals(otherNsApprovalTasks),
      ).size;

      if (uniquePipelineRuns > 0) {
        toastID = addToast({
          variant: AlertVariant.custom,
          title: t('Task approval required'),
          content: (
            <ApprovalToastContent
              type="other"
              uniquePipelineRuns={uniquePipelineRuns}
              adminconsolePath={adminconsolePath}
            />
          ),
          timeout: 25000,
          dismissible: true,
        });
      }
      setCurrentToasts((toasts) => ({
        ...toasts,
        other: { toastId: toastID },
      }));
    }
  }, [approvalTasks, currentUser, t, addToast, removeToast]);
};
