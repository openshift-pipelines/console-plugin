import * as React from 'react';

import {
  Action,
  K8sModel,
  K8sResourceCommon,
  k8sDelete,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import DeleteModal from '../modals/DeleteModal';
import { useModal } from '../modals/ModalProvider';
import { DELETED_RESOURCE_IN_K8S_ANNOTATION } from '../../consts';

import './TasksNavigationPage.scss';

type TaskRunActionDropdownProps = {
  resource: K8sResourceCommon;
  model: K8sModel;
};

const TaskRunActionDropdown: React.FC<TaskRunActionDropdownProps> = ({
  resource,
  model,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { createModal } = useModal();

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const { name, namespace } = resource.metadata;
  const canDeleteTaskRun = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const onDelete = async () => {
    await k8sDelete({
      model,
      resource,
    });
  };

  const message = (
    <p className="task-run-list__modal">
      {t(
        'This action will delete resource from k8s but still the resource can be fetched from Tekton Results.',
      )}
    </p>
  );

  const actions = [
    {
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <DeleteModal
            headerText={t('Delete {{resourceKind}}?', {
              resourceKind: model.kind,
            })}
            isOpen={isOpen}
            obj={resource}
            onClose={onClose}
            onDeleteSubmit={onDelete}
            body={message}
            shouldRedirect={false}
          />
        )),
      id: 'delete-template',
      label: t('Delete {{resourceKind}}', {
        resourceKind: model.kind,
      }),
      description: null,
      disabled:
        !canDeleteTaskRun[0] ||
        resource?.metadata?.annotations?.[
          DELETED_RESOURCE_IN_K8S_ANNOTATION
        ] === 'true',
    },
  ];

  const handleClick = (action: Action) => {
    if (typeof action?.cta === 'function') {
      action?.cta();
      setIsOpen(false);
    }
  };

  return (
    <Dropdown
      dropdownItems={actions?.map((action) =>
        resource?.metadata?.annotations?.[
          DELETED_RESOURCE_IN_K8S_ANNOTATION
        ] === 'true' ? (
          <Tooltip
            content={t('Resource is being fetched from Tekton Results.')}
            key="taskrun-delete-tooltip"
          >
            <DropdownItem
              data-test-id={action?.id}
              description={action?.description}
              isDisabled={action?.disabled}
              key={action?.id}
              onClick={() => handleClick(action)}
            >
              {action?.label}
            </DropdownItem>
          </Tooltip>
        ) : (
          <DropdownItem
            data-test-id={action?.id}
            description={action?.description}
            isDisabled={action?.disabled}
            key={action?.id}
            onClick={() => handleClick(action)}
          >
            {action?.label}
          </DropdownItem>
        ),
      )}
      key="taskrun-kebab-dropdown"
      toggle={<KebabToggle onToggle={setIsOpen} />}
      data-test-id="virtual-machine-instance-migration-actions"
      isOpen={isOpen}
      isPlain={true}
      position={DropdownPosition.right}
    />
  );
};

export default TaskRunActionDropdown;
