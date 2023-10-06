import * as _ from 'lodash';
import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { alphanumericCompare } from './utils';
import { useTranslation } from 'react-i18next';

import './PipelinesOverview.scss';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

const NameSpaceDropdown = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [isOpen, setValue] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setValue((v) => !v), []);
  const setClosed = React.useCallback(() => setValue(false), []);
  const [selected, setSelected] = React.useState('All');

  const [options, optionsLoaded] = useK8sWatchResource<any[]>({
    isList: true,
    kind: 'Project',
    optional: true,
  });

  const optionItems = React.useMemo(() => {
    if (!optionsLoaded) {
      return [];
    }
    const items = options.map((item) => {
      const { name } = item.metadata;
      return name;
    });

    items.sort((a, b) => alphanumericCompare(a, b));

    items.unshift('All');
    return items;
  }, [options, optionsLoaded]);

  return (
    <>
      <label className="project-dropdown-label">{t('Project')}</label>
      <Dropdown
        allowFullScreen={false}
        dropdownItems={_.map(optionItems, (name, key) => (
          <DropdownItem
            component="button"
            key={key}
            onClick={() => setSelected(name)}
            listItemClassName={'max-height-menu'}
            className={'max-height-menu'}
          >
            {name}
          </DropdownItem>
        ))}
        isOpen={isOpen}
        onSelect={setClosed}
        toggle={<DropdownToggle onToggle={toggleIsOpen}>{selected}</DropdownToggle>}
        isFullHeight={false}
        className="pipeline-overview__variable-dropdown"
      />
    </>
  );
};

export default NameSpaceDropdown;
