import * as React from 'react';
import { PipelineRunKind } from '../../types';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { KEBAB_BUTTON_ID } from '../../consts';
import { useTranslation } from 'react-i18next';
import {
  k8sCreate,
  k8sPatch,
  useAccessReview,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import { returnValidPipelineRunModel } from '../utils/pipeline-utils';
import { getPipelineRunData } from '../utils/utils';

type PipelineRunsKebabProps = {
  obj: PipelineRunKind;
};

const PipelineRunsKebab: React.FC<PipelineRunsKebabProps> = ({ obj }) => {
  const { t } = useTranslation();
  const launchDeleteModal = useDeleteModal(obj);
  const [isOpen, setIsOpen] = React.useState(false);
  const { name, namespace } = obj.metadata;

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const canCreateResource = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'create',
    name,
    namespace,
  });

  const canEditResource = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'update',
    name,
    namespace,
  });
  const canDeleteResource = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const reRunAction = () => {
    const { pipelineRef, pipelineSpec } = obj.spec;
    if (namespace && (pipelineRef?.name || pipelineSpec)) {
      k8sCreate({
        model: returnValidPipelineRunModel(obj),
        data: getPipelineRunData(null, obj),
      });
    } else {
      // errorModal({
      //   error: i18n.t(
      //     'pipelines-plugin~Invalid PipelineRun configuration, unable to start Pipeline.',
      //   ),
      // });
      console.log(
        'Invalid PipelineRun configuration, unable to start Pipeline.',
      );
    }
  };

  const cancelAction = () => {
    k8sPatch({
      model: PipelineRunModel,
      resource: {
        metadata: {
          name,
          namespace,
        },
      },
      data: [
        {
          op: 'replace',
          path: `/spec/status`,
          value: 'CancelledRunFinally',
        },
      ],
    });
  };

  const stopAction = () => {
    k8sPatch({
      model: PipelineRunModel,
      resource: {
        metadata: { name, namespace },
      },
      data: [
        {
          op: 'replace',
          path: `/spec/status`,
          value: 'StoppedRunFinally',
        },
      ],
    });
  };

  const dropdownItems = [
    <DropdownItem
      key="reRun"
      component="button"
      isDisabled={!canCreateResource}
      data-test-action="reRun-pipelineRun"
      onClick={reRunAction}
    >
      {t('Rerun')}
    </DropdownItem>,
    <DropdownItem
      key="cancel"
      component="button"
      isDisabled={!canEditResource}
      data-test-action="cancel-pipelineRun"
      tooltipProps={{
        content: t(
          'Interrupt any executing non finally tasks, then execute finally tasks',
        ),
      }}
      onClick={cancelAction}
    >
      {t('Cancel')}
    </DropdownItem>,
    <DropdownItem
      key="stop"
      component="button"
      isDisabled={!canEditResource}
      data-test-action="stop-pipelineRun"
      tooltipProps={{
        content: t(
          'Let the running tasks complete, then execute finally tasks',
        ),
      }}
      onClick={stopAction}
    >
      {t('Stop')}
    </DropdownItem>,
    <DropdownItem
      key="delete"
      component="button"
      onClick={launchDeleteModal}
      isDisabled={!canDeleteResource}
      data-test-action="delete-pipelineRun"
    >
      {t('Delete PipelineRun')}
    </DropdownItem>,
  ];

  return (
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

export default PipelineRunsKebab;
