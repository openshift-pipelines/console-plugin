import * as React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { map } from 'lodash';
import { StatusOptions } from './utils';

const StatusDropdown = () => {
  const [isOpen, setValue] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setValue((v) => !v), []);
  const setClosed = React.useCallback(() => setValue(false), []);
  const statusOptions = StatusOptions();
  return (
    <div className="form-group">
      <div>
        <Dropdown
          isOpen={isOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle ref={toggleRef} onClick={toggleIsOpen}>
              {'All statuses'}
            </MenuToggle>
          )}
        >
          <DropdownList>
            {map(statusOptions, (name, key) => (
              <DropdownItem
                component="button"
                key={key}
                onClick={() => {
                  setClosed();
                }}
              >
                {name}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </div>
    </div>
  );
};

export default StatusDropdown;
