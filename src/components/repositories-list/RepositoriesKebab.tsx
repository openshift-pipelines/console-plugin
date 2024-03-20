import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { K8sCommonKebabMenu } from '../utils/k8s-common-kebab-menu';
import * as React from 'react';
import { RepositoryModel } from '../../models';
import {
  Dropdown,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { KEBAB_BUTTON_ID } from '../../consts';

type RepositoriesKebabProps = {
  obj: K8sResourceCommon;
};

const RepositoriesKebab: React.FC<RepositoriesKebabProps> = ({ obj }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const dropdownItems = K8sCommonKebabMenu(obj, RepositoryModel);

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

export default RepositoriesKebab;
