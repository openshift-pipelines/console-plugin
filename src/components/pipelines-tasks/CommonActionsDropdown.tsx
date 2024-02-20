import * as React from 'react';
import { useHistory } from 'react-router-dom';

import {
  Action,
  K8sModel,
  K8sResourceCommon,
  k8sDelete,
  k8sPatch,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  KebabToggle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { AnnotationsModal } from '../modals/AnnotationsModal';
import { LabelsModal } from '../modals/LabelsModal';
import DeleteModal from '../modals/DeleteModal';
import { useModal } from '../modals/ModalProvider';

type CommonActionsDropdownProps = {
  isKebabToggle?: boolean;
  resource: K8sResourceCommon;
  model: K8sModel;
};

const CommonActionsDropdown: React.FC<CommonActionsDropdownProps> = ({
  isKebabToggle,
  resource,
  model,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const history = useHistory();
  const { createModal } = useModal();
  const { name, namespace } = resource.metadata;

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const editURL = namespace
    ? `/k8s/ns/${namespace}/${getReferenceForModel(model)}/${encodeURIComponent(
        name,
      )}/yaml`
    : `/k8s/cluster/${getReferenceForModel(model)}/${encodeURIComponent(
        name,
      )}/yaml`;

  const canEditResource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'update',
    name,
    namespace,
  });
  const canDeleteResource = useAccessReview({
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

  const actions = [
    {
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <LabelsModal
            onLabelsSubmit={(labels) =>
              k8sPatch({
                data: [
                  {
                    op: 'replace',
                    path: '/metadata/labels',
                    value: labels,
                  },
                ],
                model: model,
                resource,
              })
            }
            isOpen={isOpen}
            obj={resource}
            onClose={onClose}
          />
        )),
      id: 'edit-labels',
      label: t('Edit labels'),
      description: null,
      disabled: !canEditResource[0],
    },
    {
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <AnnotationsModal
            onSubmit={(updatedAnnotations) =>
              k8sPatch({
                data: [
                  {
                    op: 'replace',
                    path: '/metadata/annotations',
                    value: updatedAnnotations,
                  },
                ],
                model: model,
                resource,
              })
            }
            isOpen={isOpen}
            obj={resource}
            onClose={onClose}
          />
        )),
      id: 'edit-annotations',
      label: t('Edit annotations'),
      description: null,
      disabled: !canEditResource[0],
    },
    {
      cta: () => history.push(editURL),
      id: 'edit-tasks',
      label: t('Edit {{resourceKind}}', { resourceKind: model.kind }),
      description: null,
      disabled: !canEditResource[0],
    },
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
            shouldRedirect={false}
          />
        )),
      id: 'delete-template',
      label: t('Delete {{resourceKind}}', {
        resourceKind: model.kind,
      }),
      description: null,
      disabled: !canDeleteResource[0],
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
      dropdownItems={actions?.map((action) => (
        <DropdownItem
          data-test-id={action?.id}
          description={action?.description}
          isDisabled={action?.disabled}
          key={action?.id}
          onClick={() => handleClick(action)}
        >
          {action?.label}
        </DropdownItem>
      ))}
      toggle={
        isKebabToggle ? (
          <KebabToggle onToggle={setIsOpen} />
        ) : (
          <DropdownToggle onToggle={setIsOpen}>{t('Actions')}</DropdownToggle>
        )
      }
      data-test-id="virtual-machine-instance-migration-actions"
      isOpen={isOpen}
      isPlain={isKebabToggle}
      position={DropdownPosition.right}
    />
  );
};

export default CommonActionsDropdown;
