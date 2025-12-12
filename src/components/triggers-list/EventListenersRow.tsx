import * as React from 'react';
import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
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
import { getResourceModelFromBindingKind } from '../utils/pipeline-augment';

type EventListenersKebabProps = {
  obj: K8sResourceCommon;
};

getResourceModelFromBindingKind;

const EventListenersKebab: React.FC<EventListenersKebabProps> = ({ obj }) => {
  const model = getResourceModelFromBindingKind(obj?.kind);
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const dropdownItems = K8sCommonKebabMenu(obj, model);

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

const EventListenersRow: React.FC<RowProps<K8sResourceCommon>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const model = getResourceModelFromBindingKind(obj?.kind);
  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(model)}
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
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
      >
        <EventListenersKebab obj={obj} />
      </TableData>
    </>
  );
};

export default EventListenersRow;
