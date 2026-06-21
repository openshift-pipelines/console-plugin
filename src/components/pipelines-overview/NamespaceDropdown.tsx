import * as _ from 'lodash';
import * as React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { alphanumericCompare } from './utils';
import { useTranslation } from 'react-i18next';

import './PipelinesOverview.scss';
import {
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Project } from '../../types/openshift';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { FLAGS } from '../../types';

interface NameSpaceDropdownProps {
  selected: string;
  setSelected: (n: string) => void;
}

const NameSpaceDropdown: React.FC<NameSpaceDropdownProps> = ({
  selected,
  setSelected,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setValue] = React.useState(false);
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  const toggleIsOpen = React.useCallback(() => setValue((v) => !v), []);
  const setClosed = React.useCallback(() => setValue(false), []);

  const [projects, projectsLoaded] = useK8sWatchResource<Project[]>({
    isList: true,
    kind: 'Project',
    optional: true,
  });

  const allNamespacesTitle = t('All');

  const optionItems = React.useMemo(() => {
    if (!projectsLoaded) {
      return [];
    }
    const items = projects.map((item) => {
      const { name } = item.metadata;
      return { title: name, key: name };
    });

    if (
      !items.some((option) => option.title === selected) &&
      selected !== ALL_NAMESPACES_KEY
    ) {
      items.push({ title: selected, key: selected }); // Add current namespace if it isn't included
    }
    items.sort((a, b) => alphanumericCompare(a.title, b.title));

    // Always show "All" option - behavior depends on user permissions:
    // - Admins (canListNS=true): See all cluster namespaces
    // - Non-admins (canListNS=false): See all their accessible namespaces
    if (projects.length > 0) {
      items.unshift({ title: allNamespacesTitle, key: ALL_NAMESPACES_KEY });
    }
    return items;
  }, [projects, projectsLoaded, allNamespacesTitle]);

  return (
    <>
      <label className="project-dropdown-label">{t('Project')}</label>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={(isOpen: boolean) => setValue(isOpen)}
        onSelect={setClosed}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={toggleIsOpen}
            isExpanded={isOpen}
          >
            {selected !== ALL_NAMESPACES_KEY ? selected : allNamespacesTitle}
          </MenuToggle>
        )}
        className="pipeline-overview__variable-dropdown"
        isScrollable
      >
        <DropdownList>
          {_.map(optionItems, (name, key) => (
            <DropdownItem
              component="button"
              key={key}
              onClick={() => setSelected(name.key)}
              className={'max-height-menu'}
            >
              {name.title}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    </>
  );
};

export default NameSpaceDropdown;
