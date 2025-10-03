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
import {
  ApprovalStatus,
  ApprovalTaskKind,
  ApproverStatusResponse,
} from '../../../types';
import { ApprovalTaskModel } from '../../../models';
import { ApprovalLabels, ApprovalFields } from '../../../consts';
import { useToast } from '../../toast/useToast';
import { useActiveUserWithUpdate } from '../../hooks/hooks';
import { isUserAuthorizedForApproval } from '../../utils/approval-group-utils';

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

export const PipelineApprovalContext = React.createContext({});

export const PipelineApprovalContextProvider = PipelineApprovalContext.Provider;

export const usePipelineApprovalToast = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { addToast, removeToast } = useToast();
  const [namespace] = useActiveNamespace();
  const { currentUser, updateUserInfo } = useActiveUserWithUpdate();
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
  }, [approvalTasks, currentUser.username, t, addToast, removeToast]);

  React.useEffect(() => {
    const processApprovalTasks = async () => {
      let toastID = '';

      // Filter approval tasks for current user with async group checking
      const userApprovalTasksInWait = [];
      for (const approvalTask of approvalTasks) {
        if (approvalTask?.status?.state === ApprovalStatus.RequestSent) {
          try {
            const isApprover = await isUserAuthorizedForApproval(
              currentUser.username,
              approvalTask?.spec?.approvers,
              currentUser,
              updateUserInfo,
            );

            // Check if user has already responded
            const hasUserResponded =
              approvalTask?.status?.approversResponse?.some((response) => {
                // Check if user responded directly
                if (
                  response.type === 'User' &&
                  response.name === currentUser.username
                ) {
                  return true;
                }
                // Check if user responded as part of a group
                if (response.type === 'Group' && response.groupMembers) {
                  return response.groupMembers.some(
                    (member) =>
                      member.name === currentUser.username &&
                      member.response !== ApproverStatusResponse.Pending,
                  );
                }
                return false;
              });

            if (isApprover && !hasUserResponded) {
              userApprovalTasksInWait.push(approvalTask);
            }
          } catch (error) {
            console.warn('Error checking user approval authorization:', error);
          }
        }
      }

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
    };

    processApprovalTasks();
  }, [
    approvalTasks,
    currentUser.username,
    namespace,
    t,
    addToast,
    devconsolePath,
    adminconsolePath,
  ]);
};
