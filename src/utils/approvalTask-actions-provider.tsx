import { useMemo, useState, useEffect } from 'react';
import {
  Action,
  useAccessReview,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { ApprovalTaskModel } from '../models';
import { ApprovalTaskKind, ApproverStatusResponse } from '../types';
import { ApprovalFields, ApprovalLabels } from '../consts';
import { approvalModal } from '../components/approval-tasks/modal';
import { useActiveUserWithUpdate } from '../components/hooks/hooks';
import { isUserAuthorizedForApproval } from '../components/utils/approval-group-utils';

export const useApprovalTaskActionsProvider = (
  resource: ApprovalTaskKind,
): [Action[], boolean, any] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { currentUser, updateUserInfo } = useActiveUserWithUpdate();
  const launchOverlay = useOverlay();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const { name, namespace } = resource.metadata;
  const state = resource.status?.state;
  const approvers = resource.spec?.approvers;
  const pipelineRunName =
    resource.metadata?.labels?.[ApprovalLabels[ApprovalFields.PIPELINE_RUN]];

  const [canPatchApprovalTask, loadingCanPatchApprovalTask] = useAccessReview({
    group: ApprovalTaskModel.apiGroup,
    resource: ApprovalTaskModel.plural,
    verb: 'patch',
    name,
    namespace,
  });

  useEffect(() => {
    const checkAuthorization = async () => {
      if (currentUser && approvers) {
        try {
          if (currentUser?.username) {
            const authorized = await isUserAuthorizedForApproval(
              currentUser.username,
              approvers,
              currentUser,
              updateUserInfo,
            );
            setIsAuthorized(authorized);
          }
        } catch (error) {
          console.error('Error checking group authorization:', error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
    };
    checkAuthorization();
  }, [currentUser, approvers]);

  const loaded = !loadingCanPatchApprovalTask && isAuthorized !== null;

  const isDisabled =
    !loaded ||
    !canPatchApprovalTask ||
    state !== ApproverStatusResponse.Pending ||
    !isAuthorized;

  const disabledTooltip = () => {
    if (!loaded) return t('Checking authorization...');
    if (!canPatchApprovalTask) return t('Insufficient permissions');
    if (state === ApproverStatusResponse.Timedout)
      return t('PipelineRun has timed out');
    if (state !== ApproverStatusResponse.Pending)
      return t(`PipelineRun has been {{state}}`, { state });
    if (!isAuthorized) return t('User not an approver');
    return undefined;
  };
  return useMemo<[Action[], boolean, any]>(() => {
    const actions: Action[] = [
      {
        id: 'approve-approvaltask',
        label: t('Approve'),
        disabled: isDisabled,
        disabledTooltip: disabledTooltip(),
        cta: () => {
          launchOverlay(approvalModal, {
            resource,
            pipelineRunName,
            userName: currentUser?.username,
            currentUser,
            type: 'approve',
          });
        },
      },
      {
        id: 'reject-approvaltask',
        label: t('Reject'),
        disabled: isDisabled,
        disabledTooltip: disabledTooltip(),
        cta: () => {
          launchOverlay(approvalModal, {
            resource,
            pipelineRunName,
            userName: currentUser?.username,
            currentUser,
            type: 'reject',
          });
        },
      },
    ];
    return [actions, loaded, undefined];
  }, [
    resource,
    currentUser,
    isDisabled,
    loaded,
    canPatchApprovalTask,
    isAuthorized,
    state,
    pipelineRunName,
    launchOverlay,
  ]);
};
