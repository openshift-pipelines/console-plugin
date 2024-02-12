import * as React from 'react';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';
import { TimeRangeOptions } from './utils';

interface TimeRangeDropdownProps {
  timespan: number;
  setTimespan: (t: number) => void;
}

const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({
  timespan,
  setTimespan,
}) => {
  const [isOpen, setValue] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setValue((v) => !v), []);
  const setClosed = React.useCallback(() => setValue(false), []);
  const onChange = React.useCallback(
    (v: string) => setTimespan(parsePrometheusDuration(v)),
    [setTimespan],
  );
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const timeRangeOptions = TimeRangeOptions();
  return (
    <div className="form-group">
      <label>{t('Time Range')}</label>
      <div>
        <Dropdown
          dropdownItems={map(timeRangeOptions, (name, key) => (
            <DropdownItem
              component="button"
              key={key}
              onClick={() => {
                onChange(key);
                setClosed();
              }}
            >
              {name}
            </DropdownItem>
          ))}
          className="pipeline-overview__variable-dropdown"
          isOpen={isOpen}
          toggle={
            <DropdownToggle onToggle={toggleIsOpen}>
              {timeRangeOptions[formatPrometheusDuration(timespan)]}
            </DropdownToggle>
          }
        />
      </div>
    </div>
  );
};

export default TimeRangeDropdown;
