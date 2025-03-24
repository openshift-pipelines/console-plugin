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
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { K8sCommonKebabMenu } from '../utils/k8s-common-kebab-menu';
import { TaskKind } from 'src/types';
import { getTaskName } from '../utils/pipeline-augment';

type TasksKebabProps = {
  obj: K8sResourceCommon;
};

const TaskKebab: React.FC<TasksKebabProps> = ({ obj }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const dropdownItems = K8sCommonKebabMenu(obj, TaskModel);

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

const TaskRow: React.FC<RowProps<TaskKind>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          kind={getReferenceForModel(TaskModel)}
          name={getTaskName(obj)}
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
