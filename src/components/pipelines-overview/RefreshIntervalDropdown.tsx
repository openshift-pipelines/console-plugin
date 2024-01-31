import * as _ from 'lodash';
import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { IntervalOptions, useBoolean } from './utils';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';

import './PipelinesOverview.scss';

const OFF_KEY = 'OFF_KEY';

type Props = {
  interval: number;
  setInterval: (v: number) => void;
  id?: string;
};

const IntervalDropdown: React.FC<Props> = ({ id, interval, setInterval }) => {
  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);
  const intervalOptions = IntervalOptions();

  const onChange = React.useCallback(
    (v: string) =>
      setInterval(v === OFF_KEY ? null : parsePrometheusDuration(v)),
    [setInterval],
  );

  const selectedKey =
    interval === null ? OFF_KEY : formatPrometheusDuration(interval);

  return (
    <Dropdown
      dropdownItems={_.map(intervalOptions, (name, key) => (
        <DropdownItem
          component="button"
          key={key}
          onClick={() => onChange(key)}
        >
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={setClosed}
      toggle={
        <DropdownToggle
          className="pipeline-overview__dropdown-button"
          id={`${id}-dropdown`}
          onToggle={toggleIsOpen}
        >
          {intervalOptions[selectedKey]}
        </DropdownToggle>
      }
      className="pipeline-overview__variable-dropdown"
    />
  );
};

export default IntervalDropdown;
