import * as React from 'react';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
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
          dropdownItems={map(statusOptions, (name, key) => (
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
          isOpen={isOpen}
          toggle={
            <DropdownToggle onToggle={toggleIsOpen}>
              {'All statuses'}
            </DropdownToggle>
          }
        />
      </div>
    </div>
  );
};

export default StatusDropdown;
