import { createContext, useState, useEffect } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  WatchK8sResource,
  useAccessReview,
  useActiveNamespace,
  useActivePerspective,
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
import {
  ApprovalLabels,
  ApprovalFields,
  DEV_PERSPECTIVE_BASE_PATH,
  ADMIN_PERSPECTIVE_BASE_PATH,
} from '../../../consts';
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

export const PipelineApprovalContext = createContext({});

export const PipelineApprovalContextProvider = PipelineApprovalContext.Provider;

export const usePipelineApprovalToast = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { addToast, removeToast } = useToast();
  const [namespace] = useActiveNamespace();
  const { currentUser, updateUserInfo } = useActiveUserWithUpdate();
  const [currentToasts, setCurrentToasts] = useState<{
    [key: string]: { toastId: string };
  }>({});
  const [perspective] = useActivePerspective();
  const basePath =
    perspective.toLowerCase() === 'dev'
      ? DEV_PERSPECTIVE_BASE_PATH
      : ADMIN_PERSPECTIVE_BASE_PATH;
  const currentNsPath = `${basePath}/ns/${namespace}/approvals?rowFilter-status=pending`;

  const [canAccessAllNamespace] = useAccessReview({
    group: '',
    resource: 'namespaces',
    verb: 'list',
  });

  const approvalsResource: WatchK8sResource = {
    groupVersionKind: getGroupVersionKindForModel(ApprovalTaskModel),
    isList: true,
  };
  const [approvalTasks] =
    useK8sWatchResource<ApprovalTaskKind[]>(approvalsResource);
  useEffect(() => {
    Object.entries(currentToasts).forEach(([key, { toastId }]) => {
      if (toastId) {
        removeToast(toastId);
        setCurrentToasts((toasts) => ({ ...toasts, [key]: { toastId: '' } }));
      }
    });
    //cleanup to removeToast
    return () => {
      Object.entries(currentToasts).forEach(([key, { toastId }]) => {
        if (toastId) {
          removeToast(toastId);
        }
      });
    };
  }, [
    approvalTasks,
    currentUser.username,
    t,
    addToast,
    removeToast,
    namespace,
  ]);

  useEffect(() => {
    const processApprovalTasks = async () => {
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
          const toastID = addToast({
            variant: AlertVariant.custom,
            title: t('Task approval required'),
            content: (
              <ApprovalToastContent
                type="current"
                uniquePipelineRuns={uniquePipelineRuns}
                path={currentNsPath}
              />
            ),
            timeout: 25000,
            dismissible: true,
          }) as any;
          setCurrentToasts((toasts) => ({
            ...toasts,
            current: { toastId: toastID },
          }));
        }
      }

      if (otherNsApprovalTasks.length > 0) {
        const tasksByNamespace = otherNsApprovalTasks.reduce<
          Record<string, ApprovalTaskKind[]>
        >((acc, task) => {
          const ns = task?.metadata?.namespace;
          if (ns) {
            acc[ns] = acc[ns] || [];
            acc[ns].push(task);
          }
          return acc;
        }, {});

        if (canAccessAllNamespace) {
          const allNsPath = `${basePath}/all-namespaces/approvals?rowFilter-status=pending`;
          const totalPipelineRuns = new Set(
            getPipelineRunsofApprovals(otherNsApprovalTasks),
          ).size;
          const toastId = addToast({
            variant: AlertVariant.custom,
            title: t('Task approval required'),
            content: (
              <ApprovalToastContent
                type="admin"
                uniquePipelineRuns={totalPipelineRuns}
                path={allNsPath}
              />
            ),
            timeout: 25000,
            dismissible: true,
          }) as any;
          setCurrentToasts((toasts) => ({
            ...toasts,
            [`all-ns`]: { toastId: toastId },
          }));
        } else {
          Object.entries(tasksByNamespace).forEach(([ns, tasks]) => {
            const uniquePipelineRuns = new Set(
              getPipelineRunsofApprovals(tasks),
            ).size;

            if (uniquePipelineRuns > 0) {
              const nsPath = `${basePath}/ns/${ns}/approvals?rowFilter-status=pending`;
              const toastID = addToast({
                variant: AlertVariant.custom,
                title: t('Task approval required'),
                content: (
                  <ApprovalToastContent
                    type="other"
                    uniquePipelineRuns={uniquePipelineRuns}
                    path={nsPath}
                    namespaceName={ns}
                  />
                ),
                timeout: 25000,
                dismissible: true,
              }) as any;
              setCurrentToasts((toasts) => ({
                ...toasts,
                [`other-${ns}`]: { toastId: toastID },
              }));
            }
          });
        }
      }
    };

    processApprovalTasks();
  }, [
    approvalTasks,
    currentUser.username,
    namespace,
    t,
    addToast,
    basePath,
    currentNsPath,
    updateUserInfo,
    canAccessAllNamespace,
  ]);
};
