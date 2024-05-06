import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { ApprovalTaskKind, PipelineRunKind } from '../../types';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { SDKStoreState } from '@openshift-console/dynamic-plugin-sdk/lib/app/redux-types';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Tooltip,
} from '@patternfly/react-core';
import { KEBAB_BUTTON_ID } from '../../consts';
import { useTranslation } from 'react-i18next';
import {
  UserInfo,
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel } from '../../models';
import { approvalModal } from './modal';
import { ApproverStatusResponse } from '../../types';

type ApprovalTaskActionDropdownProps = {
  approvalTask: ApprovalTaskKind;
  pipelineRun: PipelineRunKind;
};

const ApprovalTaskActionDropdown: React.FC<ApprovalTaskActionDropdownProps> = ({
  approvalTask,
  pipelineRun,
}) => {
  const currentUser: UserInfo = useSelector(
    (state: SDKStoreState) => state.sdkCore.user,
  );
  const launchModal = useModal();
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace },
    status: { approvers, state },
  } = approvalTask;
  const [isOpen, setIsOpen] = React.useState(false);
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
      userName: currentUser.username,
      type: 'approve',
    });
  };

  const rejectAction = () => {
    launchModal(approvalModal, {
      resource: approvalTask,
      pipelineRunName: pipelineRun?.metadata?.name,
      userName: currentUser.username,
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

  const isDropdownDisabled =
    !canApproveAndRejectResource ||
    state !== ApproverStatusResponse.Pending ||
    !approvers?.find((approver) => approver === currentUser.username);

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
    if (!approvers?.find((approver) => approver === currentUser.username)) {
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
