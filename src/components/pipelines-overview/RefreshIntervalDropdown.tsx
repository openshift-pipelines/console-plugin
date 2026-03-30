import * as _ from 'lodash';
import type { FC, Ref } from 'react';
import { useState, useCallback } from 'react';
import {
  Dropdown,
  DropdownItem,
  MenuToggleElement,
  MenuToggle,
  DropdownList,
} from '@patternfly/react-core';
import { IntervalOptions } from './utils';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';

const OFF_KEY = 'OFF_KEY';

type Props = {
  interval: number;
  setInterval: (v: number) => void;
  id?: string;
};

const IntervalDropdown: FC<Props> = ({ id, interval, setInterval }) => {
  const [isOpen, setValue] = useState(false);
  const toggleIsOpen = useCallback(() => setValue((v) => !v), []);
  const setClosed = useCallback(() => setValue(false), []);
  const intervalOptions = IntervalOptions();

  const onChange = useCallback(
    (v: string) =>
      setInterval(v === OFF_KEY ? null : parsePrometheusDuration(v)),
    [setInterval],
  );

  const selectedKey =
    interval === null ? OFF_KEY : formatPrometheusDuration(interval);

  return (
    (<Dropdown
      isOpen={isOpen}
      onSelect={setClosed}
      onOpenChange={(isOpen: boolean) => setValue(isOpen)}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={toggleIsOpen}
          className="pipeline-overview__dropdown-button"
          id={`${id}-dropdown`}
        >
          {intervalOptions[selectedKey]}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {_.map(intervalOptions, (name, key) => (
          <DropdownItem
            component="button"
            key={key}
            onClick={() => onChange(key)}
          >
            {name}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>)
  );
};

export default IntervalDropdown;
