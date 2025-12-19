import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { withTranslation } from 'react-i18next';
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
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
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

interface State {
  resources: {};
  items: {};
  title: React.ReactNode;
  isOpen: boolean;
  filterValue: string;
}

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
  selectedKey: string;
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
  t: TFunction;
}

class ResourceDropdown extends React.Component<ResourceDropdownProps, State> {
  constructor(props) {
    super(props);
    this.state = {
      resources: this.props.loaded ? this.getResourceList(props) : {},
      items: this.props.loaded ? this.getDropdownList(props, false) : {},
      title: this.props.loaded ? (
        <span className="btn-dropdown__item--placeholder">
          {this.props.placeholder}
        </span>
      ) : (
        <LoadingInline />
      ),
      isOpen: false,
      filterValue: '',
    };
    this.onToggle = this.onToggle.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  UNSAFE_componentWillReceiveProps(nextProps: ResourceDropdownProps) {
    const {
      loaded,
      loadError,
      autoSelect,
      selectedKey,
      placeholder,
      onLoad,
      title,
      actionItems,
    } = nextProps;
    if (!loaded && !loadError) {
      this.setState({ title: <LoadingInline /> });
      return;
    }

    // If autoSelect is true only then have an item pre-selected based on selectedKey.
    if (
      !this.props.loadError &&
      !autoSelect &&
      (!this.props.loaded || !selectedKey)
    ) {
      this.setState({
        title: (
          <span className="btn-dropdown__item--placeholder">{placeholder}</span>
        ),
      });
    }

    if (loadError) {
      this.setState({
        title: (
          <span className="cos-error-title">
            {this.props.t(
              'plugin__pipelines-console-plugin~Error loading - {{placeholder}}',
              {
                placeholder,
              },
            )}
          </span>
        ),
      });
      return;
    }

    const resourceList = this.getDropdownList(
      { ...this.props, ...nextProps },
      true,
    );
    // set placeholder as title if resourceList is empty no actionItems are there
    if (
      loaded &&
      !loadError &&
      _.isEmpty(resourceList) &&
      !actionItems &&
      placeholder &&
      !title
    ) {
      this.setState({
        title: (
          <span className="btn-dropdown__item--placeholder">{placeholder}</span>
        ),
      });
    }
    this.setState({ items: resourceList });
    if (nextProps.loaded && onLoad) {
      onLoad(resourceList);
    }
    this.setState({ resources: this.getResourceList(nextProps) });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (_.isEqual(this.state, nextState) && _.isEqual(this.props, nextProps)) {
      return false;
    }
    return true;
  }

  private craftResourceKey = (
    resource: K8sResourceKind,
    props: ResourceDropdownProps,
  ): { customKey: string; key: string } => {
    const { customResourceKey, resourceFilter, dataSelector } = props;
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
  };

  private getResourceList = (nextProps: ResourceDropdownProps) => {
    const { resources } = nextProps;
    const resourceList = {};
    _.each(resources, ({ data }) => {
      _.each(data, (resource) => {
        const { customKey, key } = this.craftResourceKey(resource, nextProps);
        const indexKey = customKey || key;
        if (indexKey) {
          resourceList[indexKey] = resource;
        }
      });
    });
    return resourceList;
  };

  private getDropdownList = (
    props: ResourceDropdownProps,
    updateSelection: boolean,
  ) => {
    const {
      loaded,
      actionItems,
      autoSelect,
      selectedKey,
      resources,
      transformLabel,
      allSelectorItem,
      noneSelectorItem,
      showBadge = false,
      appendItems,
    } = props;

    const unsortedList = { ...appendItems };
    const namespaces = new Set(
      _.flatten(_.map(resources, ({ data }) => data?.map(getNamespace))),
    );
    const containsMultipleNs = namespaces.size > 1;
    _.each(resources, ({ data }) => {
      _.reduce(
        data,
        (acc, resource) => {
          const { customKey, key: name } = this.craftResourceKey(
            resource,
            props,
          );
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
              acc[dataValue] = transformLabel ? transformLabel(resource) : name;
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

    if (updateSelection) {
      let selectedItem = selectedKey;
      if (
        (_.isEmpty(sortedList) || !sortedList[selectedKey]) &&
        allSelectorItem &&
        allSelectorItem.allSelectorKey !== selectedKey
      ) {
        selectedItem = allSelectorItem.allSelectorKey;
      } else if (autoSelect && !selectedKey) {
        selectedItem =
          loaded && _.isEmpty(sortedList) && actionItems
            ? actionItems[0].actionKey
            : _.get(_.keys(sortedList), 0);
      }
      selectedItem && this.handleChange(selectedItem, sortedList);
    }
    return sortedList;
  };

  private handleChange = (key, items) => {
    const name = items[key];
    const { actionItems, onChange, selectedKey } = this.props;
    const selectedActionItem =
      actionItems && actionItems.find((ai) => key === ai.actionKey);
    const title = selectedActionItem ? selectedActionItem.actionTitle : name;
    if (title !== this.state.title) {
      this.setState({ title });
    }
    if (key !== selectedKey) {
      onChange && onChange(key, name, this.state.resources[key]);
    }
  };

  private onToggle = () => {
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  };

  private onSelect = (
    _event: React.MouseEvent | undefined,
    value: string | number | undefined,
  ) => {
    const key = String(value);
    this.handleChange(key, this.state.items);
    this.setState({ isOpen: false, filterValue: '' });
  };

  private onFilterChange = (value: string) => {
    this.setState({ filterValue: value });
  };

  private getFilteredItems = () => {
    const { filterValue, items } = this.state;
    const { autocompleteFilter } = this.props;

    if (!filterValue) {
      return items;
    }

    const filter = autocompleteFilter || fuzzy;
    return _.pickBy(items, (item, key) => {
      // If item is a React element, try to get props, otherwise use the item as name
      const itemProps = React.isValidElement(item)
        ? item.props
        : { name: item };
      return filter(filterValue, itemProps);
    });
  };

  render() {
    const { isOpen, filterValue } = this.state;
    const {
      id,
      ariaLabel,
      className,
      dropDownClassName,
      titlePrefix,
      selectedKey,
      placeholder,
      disabled,
    } = this.props;
    const filteredItems = this.getFilteredItems();
    const displayTitle = this.props.title || this.state.title;

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
      <MenuToggle
        ref={toggleRef}
        onClick={this.onToggle}
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
        onSelect={this.onSelect}
        onOpenChange={(open) => this.setState({ isOpen: open })}
        toggle={toggle}
        shouldFocusToggleOnSelect
        className={className}
      >
        {this.props.autocompleteFilter && (
          <TextInputGroup>
            <TextInputGroupMain
              value={filterValue}
              onChange={(_event, value) => this.onFilterChange(value)}
              placeholder={placeholder}
              autoFocus
            />
            {filterValue && (
              <TextInputGroupUtilities>
                <Button
                  variant="plain"
                  onClick={() => this.setState({ filterValue: '' })}
                  aria-label="Clear filter"
                >
                  <TimesIcon />
                </Button>
              </TextInputGroupUtilities>
            )}
          </TextInputGroup>
        )}
        <SelectList>
          {Object.keys(filteredItems).map((key) => (
            <SelectOption key={key} value={key}>
              {filteredItems[key]}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    );
  }
}

export default withTranslation()(ResourceDropdown);
