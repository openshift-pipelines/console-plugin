import * as React from 'react';
import { ApprovalTaskKind, PipelineRunKind } from '../../types';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import { KEBAB_BUTTON_ID } from '../../consts';
import { useTranslation } from 'react-i18next';
import {
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel } from '../../models';
import { approvalModal } from './modal';
import { ApproverStatusResponse } from '../../types';
import { useActiveUserWithUpdate } from '../hooks/hooks';
import { isUserAuthorizedForApproval } from '../utils/approval-group-utils';

type ApprovalTaskActionDropdownProps = {
  approvalTask: ApprovalTaskKind;
  pipelineRun: PipelineRunKind;
};

const ApprovalTaskActionDropdown: React.FC<ApprovalTaskActionDropdownProps> = ({
  approvalTask,
  pipelineRun,
}) => {
  const { currentUser, updateUserInfo } = useActiveUserWithUpdate();
  const launchModal = useModal();
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace },
    status: { state },
    spec: { approvers },
  } = approvalTask;
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);
  const onToggle = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = () => {
    setIsOpen(false);
  };
  const approveAction = () => {
    launchModal(approvalModal, {
      resource: approvalTask,
      pipelineRunName: pipelineRun?.metadata?.name,
      userName: currentUser?.username,
      currentUser: currentUser,
      type: 'approve',
    });
  };

  const rejectAction = () => {
    launchModal(approvalModal, {
      resource: approvalTask,
      pipelineRunName: pipelineRun?.metadata?.name,
      userName: currentUser?.username,
      currentUser: currentUser,
      type: 'reject',
    });
  };

  const canApproveAndRejectResource = useAccessReview({
    group: ApprovalTaskModel.apiGroup,
    resource: ApprovalTaskModel.plural,
    verb: 'patch',
    name,
    namespace,
  });

  // Check group-based authorization
  React.useEffect(() => {
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

  const isDropdownDisabled =
    !canApproveAndRejectResource ||
    state !== ApproverStatusResponse.Pending ||
    isAuthorized === null || // Still loading
    !isAuthorized; // Not authorized (includes both direct user and group checks)

  const tooltipContent = () => {
    if (!canApproveAndRejectResource) {
      return t('Insufficient permissions');
    }
    if (state === ApproverStatusResponse.Timedout) {
      return t('PipelineRun has timed out');
    }
    if (state !== ApproverStatusResponse.Pending) {
      return t(`PipelineRun has been {{state}}`, { state });
    }
    if (isAuthorized === null) {
      return (
        (
          <Spinner
            className="pf-v5-u-mr-xs"
            size="sm"
            aria-label={t('Checking authorization...')}
          />
        ) + t('Checking authorization...')
      );
    }
    if (!isAuthorized) {
      return t('User not an approver');
    }
    return t('Permission denied');
  };

  const dropdownItems = [
    <DropdownItem
      key="approve"
      component="button"
      isDisabled={isDropdownDisabled}
      data-test-action="approve-pipelineRun"
      onClick={approveAction}
    >
      {t('Approve')}
    </DropdownItem>,
    <DropdownItem
      key="reject"
      component="button"
      isDisabled={isDropdownDisabled}
      data-test-action="reject-pipelineRun"
      onClick={rejectAction}
    >
      {t('Reject')}
    </DropdownItem>,
  ];

  return isDropdownDisabled ? (
    <Tooltip content={tooltipContent()} position="left">
      <Dropdown
        onSelect={onSelect}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            aria-label="kebab menu"
            variant="plain"
            onClick={onToggle}
            isExpanded={isOpen}
            id={KEBAB_BUTTON_ID}
            data-test={KEBAB_BUTTON_ID}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        isOpen={isOpen && !isDropdownDisabled}
        isPlain={false}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>{dropdownItems}</DropdownList>
      </Dropdown>
    </Tooltip>
  ) : (
    <Dropdown
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="kebab menu"
          variant="plain"
          onClick={onToggle}
          isExpanded={isOpen}
          id={KEBAB_BUTTON_ID}
          data-test={KEBAB_BUTTON_ID}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      isOpen={isOpen}
      isPlain={false}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default ApprovalTaskActionDropdown;
