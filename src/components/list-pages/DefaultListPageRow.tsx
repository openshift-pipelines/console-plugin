import type { FC, Ref } from 'react';
import { useState } from 'react';
import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
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
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { defaultTableColumnInfo as tableColumnInfo } from './useDefaultColumns';
import { NamespaceModel } from '../../models';
import { t } from '../utils/common-utils';
import {
  actionsCellProps,
  getNameCellProps,
} from '@openshift-console/dynamic-plugin-sdk-internal';

type DefaultKebabProps = {
  obj: K8sResourceCommon;
};

const DefaultKebab: FC<DefaultKebabProps> = ({ obj }) => {
  const model = getResourceModelFromBindingKind(obj?.kind);
  const [isOpen, setIsOpen] = useState(false);

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
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
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

export const getDefaultListPageDataViewRows: GetDataViewRows<
  K8sResourceCommon
> = (data, columns) => {
  return data.map(({ obj }) => {
    const model = getResourceModelFromBindingKind(obj?.kind);
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(model)}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
        props: {
          ...getNameCellProps(`${obj?.kind}-list`),
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: obj?.metadata?.namespace ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={obj.metadata.namespace}
          />
        ) : (
          t('None')
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <DefaultKebab obj={obj} />,
        props: { ...actionsCellProps },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
