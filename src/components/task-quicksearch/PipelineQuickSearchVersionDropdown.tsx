import * as React from 'react';
import {
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { t_chart_color_green_500 as greenColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_500';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { TektonHubTaskVersion } from '../catalog/apis/tektonHub';
import { isSelectedVersionInstalled } from './pipeline-quicksearch-utils';
import { useTranslation } from 'react-i18next';

interface PipelineQuickSearchVersionDropdownProps {
  selectedVersion: string;
  item: CatalogItem;
  versions: TektonHubTaskVersion[];
  onChange: (key: string) => void;
}

const PipelineQuickSearchVersionDropdown: React.FC<
  PipelineQuickSearchVersionDropdownProps
> = ({ item, versions, onChange, selectedVersion }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setOpen] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setOpen((v) => !v), []);

  if (!versions || !versions.length) {
    return null;
  }
  const versionItems = versions.reduce((acc, { version }) => {
    if (version) {
      acc[version.toString()] =
        version === item.data?.latestVersion?.version
          ? t('{{version}} (latest)', { version })
          : version;
    }
    return acc;
  }, {});

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      className="opp-quick-search-details__version-dropdown"
      onClick={toggleIsOpen}
      isExpanded={isOpen}
      ref={toggleRef}
      isDisabled={versions.length === 1}
      data-test="task-version"
    >
      {versionItems[selectedVersion]}
    </MenuToggle>
  );

  return (
    <Select
      className="opp-quick-search-details__version-dropdown"
      isOpen={isOpen}
      onSelect={(_, value: string) => {
        if (value) {
          onChange(value);
        }
        setOpen(false);
      }}
      toggle={toggle}
      onOpenChange={(open) => setOpen(open)}
    >
      <SelectList>
        {Object.keys(versionItems).map((key) => (
          <SelectOption key={key} label={versionItems[key]} value={key}>
            <div className="opp-quick-search-details__version-dropdown-item">
              {versionItems[key]}
              {isSelectedVersionInstalled(item, key) && (
                <CheckCircleIcon color={greenColor.value} />
              )}
            </div>
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default PipelineQuickSearchVersionDropdown;
