import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  FirehoseResult,
  getGroupVersionKindForResource,
  K8sResourceCommon,
  K8sResourceKind,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  MenuSearch,
  MenuSearchInput,
  SearchInput,
  Divider,
} from '@patternfly/react-core';
import { LoadingInline } from '../Loading';

type DropdownItemProps = {
  name: string;
  namespace?: string;
  resource: K8sResourceKind;
};

const DropdownItem: React.FC<DropdownItemProps> = ({
  name,
  namespace,
  resource,
}) => {
  return (
    <span className="co-resource-item">
      <span className="">
        <ResourceIcon
          groupVersionKind={getGroupVersionKindForResource(resource)}
        />
      </span>
      <span className="co-resource-item__resource-name">
        <span>{name}</span>
        {namespace && (
          <div className="text-muted co-truncate co-nowrap small co-resource-item__resource-namespace">
            {namespace}
          </div>
        )}
      </span>
    </span>
  );
};

export interface ResourceDropdownItems {
  [key: string]: string | React.ReactElement;
}

export const getNamespace = <A extends K8sResourceCommon = K8sResourceCommon>(
  value: A,
) =>
  _.get(
    value,
    'metadata.namespace',
  ) as K8sResourceCommon['metadata']['namespace'];

export interface ResourceDropdownProps {
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  dropDownContentClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  userSettingsPrefix?: string;
  storageKey?: string;
  disabled?: boolean;
  helpText?: React.ReactNode;
  fullWidth?: boolean;
  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  noneSelectorItem?: {
    noneSelectorKey?: string;
    noneSelectorTitle?: string;
  };
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  dataSelector: string[] | number[] | symbol[];
  transformLabel?: Function;
  loaded?: boolean;
  loadError?: string;
  placeholder?: string;
  resources?: FirehoseResult[];
  selectedKey?: string;
  autoSelect?: boolean;
  resourceFilter?: (resource: K8sResourceKind) => boolean;
  onChange?: (
    key: string,
    name?: string | object,
    selectedResource?: K8sResourceKind,
  ) => void;
  onLoad?: (items: ResourceDropdownItems) => void;
  showBadge?: boolean;
  autocompleteFilter?: (strText: string, item: object) => boolean;
  customResourceKey?: (key: string, resource: K8sResourceKind) => string;
  appendItems?: ResourceDropdownItems;
}

const ResourceDropdown: React.FC<ResourceDropdownProps> = (props) => {
  const { t } = useTranslation();
  const {
    id,
    ariaLabel,
    className,
    dropDownClassName,
    titlePrefix,
    selectedKey,
    placeholder,
    disabled,
    loaded,
    loadError,
    autoSelect,
    onLoad,
    title: propsTitle,
    actionItems,
    resources,
    customResourceKey,
    resourceFilter,
    dataSelector,
    transformLabel,
    allSelectorItem,
    noneSelectorItem,
    showBadge = false,
    appendItems,
    onChange,
    autocompleteFilter,
  } = props;

  const [resourcesState, setResourcesState] = React.useState({});
  const [items, setItems] = React.useState({});
  const [title, setTitle] = React.useState<React.ReactNode>(
    loaded ? (
      <span className="btn-dropdown__item--placeholder">{placeholder}</span>
    ) : (
      <LoadingInline />
    ),
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [filterValue, setFilterValue] = React.useState('');

  const craftResourceKey = React.useCallback(
    (resource: K8sResourceKind): { customKey: string; key: string } => {
      let key;
      if (resourceFilter && resourceFilter(resource)) {
        key = _.get(resource, dataSelector);
      } else if (!resourceFilter) {
        key = _.get(resource, dataSelector);
      }
      return {
        customKey: customResourceKey ? customResourceKey(key, resource) : key,
        key,
      };
    },
    [customResourceKey, resourceFilter, dataSelector],
  );

  const getResourceList = React.useCallback(
    (currentResources: FirehoseResult[]) => {
      const resourceList = {};
      _.each(currentResources, ({ data }) => {
        _.each(data, (resource) => {
          const { customKey, key } = craftResourceKey(resource);
          const indexKey = customKey || key;
          if (indexKey) {
            resourceList[indexKey] = resource;
          }
        });
      });
      return resourceList;
    },
    [craftResourceKey],
  );

  const getDropdownList = React.useCallback(
    (currentResources: FirehoseResult[]) => {
      const unsortedList = { ...appendItems };
      const namespaces = new Set(
        _.flatten(
          _.map(currentResources, ({ data }) => data?.map(getNamespace)),
        ),
      );
      const containsMultipleNs = namespaces.size > 1;
      _.each(currentResources, ({ data }) => {
        _.reduce(
          data,
          (acc, resource) => {
            const { customKey, key: name } = craftResourceKey(resource);
            const dataValue = customKey || name;
            if (dataValue) {
              if (showBadge) {
                const namespace = containsMultipleNs
                  ? getNamespace(resource)
                  : null;
                acc[dataValue] = getGroupVersionKindForResource(resource) ? (
                  <DropdownItem
                    key={resource.metadata.uid}
                    name={name}
                    namespace={namespace}
                    resource={resource}
                  />
                ) : (
                  name
                );
              } else {
                acc[dataValue] = transformLabel
                  ? transformLabel(resource)
                  : name;
              }
            }
            return acc;
          },
          unsortedList,
        );
      });
      const sortedList = {};

      if (allSelectorItem && !_.isEmpty(unsortedList)) {
        sortedList[allSelectorItem.allSelectorKey] =
          allSelectorItem.allSelectorTitle;
      }
      if (noneSelectorItem && !_.isEmpty(unsortedList)) {
        sortedList[noneSelectorItem.noneSelectorKey] =
          noneSelectorItem.noneSelectorTitle;
      }

      _.keys(unsortedList)
        .sort()
        .forEach((key) => {
          sortedList[key] = unsortedList[key];
        });

      return sortedList;
    },
    [
      appendItems,
      craftResourceKey,
      showBadge,
      transformLabel,
      allSelectorItem,
      noneSelectorItem,
    ],
  );

  // Handle data updates and initial load
  React.useEffect(() => {
    if (!loaded && !loadError) {
      setTitle(<LoadingInline />);
      return;
    }

    if (loadError) {
      setTitle(
        <span className="cos-error-title">
          {t(
            'plugin__pipelines-console-plugin~Error loading - {{placeholder}}',
            { placeholder },
          )}
        </span>,
      );
      return;
    }

    if (loaded && resources) {
      const resourceList = getDropdownList(resources);
      const newResources = getResourceList(resources);

      setItems(resourceList);
      setResourcesState(newResources);

      // Update title based on selectedKey
      if (propsTitle) {
        setTitle(propsTitle);
      } else if (selectedKey && resourceList[selectedKey]) {
        const selectedActionItem =
          actionItems && actionItems.find((ai) => selectedKey === ai.actionKey);
        const newTitle = selectedActionItem
          ? selectedActionItem.actionTitle
          : resourceList[selectedKey];
        setTitle(newTitle);
      } else if (autoSelect && !selectedKey && !_.isEmpty(resourceList)) {
        const firstKey = _.keys(resourceList)[0];
        const selectedActionItem =
          actionItems && actionItems.find((ai) => firstKey === ai.actionKey);
        const newTitle = selectedActionItem
          ? selectedActionItem.actionTitle
          : resourceList[firstKey];
        setTitle(newTitle);
        onChange &&
          onChange(firstKey, resourceList[firstKey], newResources[firstKey]);
      } else if (_.isEmpty(resourceList) && !actionItems) {
        setTitle(
          <span className="btn-dropdown__item--placeholder">
            {placeholder}
          </span>,
        );
      } else if (!selectedKey && !autoSelect) {
        setTitle(
          <span className="btn-dropdown__item--placeholder">
            {placeholder}
          </span>,
        );
      }

      if (onLoad) {
        onLoad(resourceList);
      }
    }
  }, [
    loaded,
    loadError,
    resources,
    selectedKey,
    placeholder,
    propsTitle,
    autoSelect,
    actionItems,
    onLoad,
    onChange,
    t,
    getDropdownList,
    getResourceList,
  ]);

  const onToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const onSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    const key = String(value);
    const name = items[key];
    const selectedActionItem =
      actionItems && actionItems.find((ai) => key === ai.actionKey);
    const newTitle = selectedActionItem ? selectedActionItem.actionTitle : name;

    setTitle(newTitle);
    setIsOpen(false);
    setFilterValue('');

    if (key !== selectedKey) {
      onChange && onChange(key, name, resourcesState[key]);
    }
  };

  const onFilterChange = (value: string) => {
    setFilterValue(value);
  };

  const getFilteredItems = () => {
    if (!filterValue) {
      return items;
    }

    return _.pickBy(items, (item) => {
      if (autocompleteFilter) {
        // For custom filters, create an object structure that filters expect
        if (React.isValidElement(item)) {
          // Ensure props.name is a string for React elements
          const itemProxy = {
            props: {
              name: String((item.props as any)?.name || ''),
            },
          };
          return autocompleteFilter(filterValue, itemProxy);
        } else {
          return autocompleteFilter(filterValue, { name: String(item || '') });
        }
      } else {
        // For default fuzzy search, extract string value
        const itemString = React.isValidElement(item)
          ? (item.props as any)?.name || ''
          : String(item || '');
        return fuzzy(filterValue, itemString);
      }
    });
  };

  const filteredItems = getFilteredItems();
  const displayTitle = propsTitle || title;

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggle}
      isExpanded={isOpen}
      isDisabled={disabled}
      className={dropDownClassName}
      id={id}
      aria-label={ariaLabel}
    >
      {titlePrefix && `${titlePrefix}: `}
      {displayTitle}
    </MenuToggle>
  );

  return (
    <Select
      id={id}
      isOpen={isOpen}
      selected={selectedKey}
      onSelect={onSelect}
      onOpenChange={(open) => setIsOpen(open)}
      onOpenChangeKeys={['Escape']}
      toggle={toggle}
      shouldFocusToggleOnSelect
      className={className}
      isScrollable
      popperProps={{ appendTo: 'inline' }}
    >
      {autocompleteFilter && (
        <>
          <MenuSearch>
            <MenuSearchInput>
              <SearchInput
                value={filterValue}
                onChange={(_event, value) => onFilterChange(value)}
                placeholder={placeholder}
                inputProps={{
                  autoFocus: true,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuSearchInput>
          </MenuSearch>
          <Divider />
        </>
      )}
      <SelectList>
        {Object.keys(filteredItems).length === 0 && filterValue ? (
          <SelectOption isDisabled>
            {t('plugin__pipelines-console-plugin~No results found')}
          </SelectOption>
        ) : (
          Object.keys(filteredItems).map((key) => (
            <SelectOption key={key} value={key}>
              {filteredItems[key]}
            </SelectOption>
          ))
        )}
      </SelectList>
    </Select>
  );
};

export default ResourceDropdown;
