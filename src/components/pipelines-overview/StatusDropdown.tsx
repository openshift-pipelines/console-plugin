import type { Ref } from 'react';
import { useState, useCallback } from 'react';
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
  const [isOpen, setValue] = useState(false);
  const toggleIsOpen = useCallback(() => setValue((v) => !v), []);
  const setClosed = useCallback(() => setValue(false), []);
  const statusOptions = StatusOptions();
  return (
    (<div className="form-group">
      <div>
        <Dropdown
          isOpen={isOpen}
          onOpenChange={(isOpen: boolean) => setValue(isOpen)}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
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
    </div>)
  );
};

export default StatusDropdown;
