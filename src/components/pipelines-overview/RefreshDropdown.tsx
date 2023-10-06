import * as React from 'react';
import { useTranslation } from 'react-i18next';
import IntervalDropdown from './RefreshIntervalDropdown';

interface RefreshDropdownProps {
  interval: number;
  setInterval: (v: number) => void;
}

const RefreshDropdown: React.FC<RefreshDropdownProps> = ({ interval, setInterval }) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return (
    <div className="form-group">
      <label htmlFor="pipeline-refresh-interval-dropdown">
        {t('Refresh Interval')}
      </label>
      <div>
        <IntervalDropdown
          id="pipeline-refresh-interval-dropdown"
          interval={interval}
          setInterval={setInterval}
        />
      </div>
    </div>
  );
};

export default RefreshDropdown;
