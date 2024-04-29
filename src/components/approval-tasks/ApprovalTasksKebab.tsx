import * as React from 'react';
import { ApprovalTaskKind, PipelineRunKind } from '../../types';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
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
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskModel } from '../../models';
import { approvalModal } from './modal';
import { ApproverStatusResponse } from '../../types';

type ApprovalTasksKebabProps = {
  obj: ApprovalTaskKind;
  pipelineRun: PipelineRunKind;
  username: string;
};

const ApprovalTasksKebab: React.FC<ApprovalTasksKebabProps> = ({
  obj,
  pipelineRun,
  username,
}) => {
  const launchModal = useModal();
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace },
    status: { approvers, state },
  } = obj;
  const [isOpen, setIsOpen] = React.useState(false);
  const onToggle = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = () => {
    setIsOpen(false);
  };
  const approveAction = () => {
    launchModal(approvalModal, {
      resource: obj,
      pipelineRunName: pipelineRun?.metadata?.name,
      userName: username,
      type: 'approve',
    });
  };

  const rejectAction = () => {
    launchModal(approvalModal, {
      resource: obj,
      pipelineRunName: pipelineRun?.metadata?.name,
      userName: username,
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
    !approvers?.find((approver) => approver === username);

  const tooltipContent = () => {
    if (!canApproveAndRejectResource) {
      return t('Insufficient permissions');
    }
    if (state !== ApproverStatusResponse.Pending) {
      return t(`PipelineRun has been {{state}}`, { state });
    }
    if (!approvers?.find((approver) => approver === username)) {
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

export default ApprovalTasksKebab;
