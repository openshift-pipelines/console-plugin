import * as React from 'react';
import {
  K8sResourceCommon,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { TaskModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { KEBAB_BUTTON_ID } from '../../consts';
import {
  Dropdown,
  DropdownPosition,
  KebabToggle,
} from '@patternfly/react-core';
import { K8sCommonKebabMenu } from '../utils/k8s-common-kebab-menu';

type TasksKebabProps = {
  obj: K8sResourceCommon;
};

const TaskKebab: React.FC<TasksKebabProps> = ({ obj }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  const onFocus = () => {
    const element = document.getElementById('kebab-button');
    element.focus();
  };

  const onSelect = () => {
    setIsOpen(false);
    onFocus();
  };

  const dropdownItems = K8sCommonKebabMenu(obj, TaskModel);

  return (
    <Dropdown
      onSelect={onSelect}
      toggle={
        <KebabToggle
          id={KEBAB_BUTTON_ID}
          data-test={KEBAB_BUTTON_ID}
          onToggle={onToggle}
        />
      }
      isOpen={isOpen}
      isPlain
      dropdownItems={dropdownItems}
      position={DropdownPosition.right}
    />
  );
};

const TaskRow: React.FC<RowProps<K8sResourceCommon>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          kind={getReferenceForModel(TaskModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('None')
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="created">
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v5-c-table__action"
        id=""
      >
        <TaskKebab obj={obj} />
      </TableData>
    </>
  );
};

export default TaskRow;
