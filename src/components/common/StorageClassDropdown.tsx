import * as React from 'react';
import { LoadingInline } from '../Loading';
import _ from 'lodash';
import classNames from 'classnames';
import { Dropdown } from './dropdown';
import * as fuzzy from 'fuzzysearch';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  FirehoseResult,
  K8sResourceKind,
  ResourceIcon,
  useK8sWatchResources,
} from '@openshift-console/dynamic-plugin-sdk';
import { ResourceName } from './ResourceName';

export type StorageClassDropdownInnerState = {
  items: any;
  name: string;
  selectedKey: string;
  title: React.ReactNode;
  defaultClass: string;
};

export type StorageClassDropdownInnerProps = WithTranslation & {
  id?: string;
  loaded?: boolean;
  storageClass: FirehoseResult<K8sResourceKind[]>;
  name: string;
  onChange: (object) => void;
  describedBy: string;
  defaultClass: string;
  required?: boolean;
  hideClassName?: string;
  filter?: (param) => boolean;
  noSelection?: boolean;
  selectedKey?: string;
};

const defaultClassAnnotation = 'storageclass.kubernetes.io/is-default-class';
const betaDefaultStorageClassAnnotation =
  'storageclass.beta.kubernetes.io/is-default-class';
export const isDefaultClass = (storageClass: K8sResourceKind) => {
  const annotations = _.get(storageClass, 'metadata.annotations') || {};
  return (
    annotations[defaultClassAnnotation] === 'true' ||
    annotations[betaDefaultStorageClassAnnotation] === 'true'
  );
};

const StorageClassDropdownEntry = (props) => {
  const storageClassProperties = [
    props.default ? ' (default)' : '',
    props.description,
    props.accessMode,
    props.provisioner,
    props.type,
    props.zone,
  ];
  const storageClassDescriptionLine = _.compact(storageClassProperties).join(
    ' | ',
  );
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={props.kindLabel} />
      <span className="co-resource-item__resource-name">
        {props.name}
        <div className="text-muted small"> {storageClassDescriptionLine}</div>
      </span>
    </span>
  );
};

const StorageClassDropdownNoStorageClassOption = (props) => {
  return (
    <span className="co-resource-item">
      <span className="co-resource-item__resource-name">{props.name}</span>
    </span>
  );
};

export class StorageClassDropdownInnerWithTranslation extends React.Component<
  StorageClassDropdownInnerProps,
  StorageClassDropdownInnerState
> {
  readonly state: StorageClassDropdownInnerState = {
    items: {},
    name: this.props.name,
    selectedKey: this.props.selectedKey,
    title: <LoadingInline />,
    defaultClass: this.props.defaultClass,
  };

  UNSAFE_componentWillMount() {
    this.UNSAFE_componentWillReceiveProps(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { loaded, loadError, storageClass, t } = nextProps;

    if (loadError) {
      this.setState({
        title: (
          <div className="cos-error-title">
            {t('plugin__pipelines-console-plugin~Error loading {{desc}}', {
              desc: nextProps.desc,
            })}
          </div>
        ),
      });
      return;
    }
    if (!loaded) {
      return;
    }

    const state = {
      items: {},
      title: {},
      defaultClass: '',
    };
    let unorderedItems = {};
    const noStorageClass = t(
      'plugin__pipelines-console-plugin~No default StorageClass',
    );
    _.map(storageClass.data, (resource) => {
      unorderedItems[resource.metadata.name] = {
        kindLabel: 'StorageClass',
        name: resource.metadata.name,
        description: _.get(resource, 'metadata.annotations.description', ''),
        default: isDefaultClass(resource),
        accessMode: _.get(
          resource,
          ['metadata', 'annotations', 'storage.alpha.openshift.io/access-mode'],
          '',
        ),
        provisioner: resource.provisioner,
        parameters: resource.parameters,
        type: _.get(resource, 'parameters.type', ''),
        zone: _.get(resource, 'parameters.zone', ''),
        resource,
      };
    });

    //Filter if user provides a custom function
    if (nextProps.filter) {
      unorderedItems = Object.keys(unorderedItems)
        .filter((sc) => nextProps.filter(unorderedItems[sc]))
        .reduce((acc, key) => {
          acc[key] = unorderedItems[key];
          return acc;
        }, {});
    }

    // Determine if there is a default storage class
    state.defaultClass = _.findKey(unorderedItems, 'default');
    const { selectedKey } = this.state;
    if (!state.defaultClass) {
      // Add No Storage Class option if there is not a default storage class
      unorderedItems[''] = { kindLabel: '', name: noStorageClass };
    }

    if (
      !this.props.loaded ||
      !selectedKey ||
      !unorderedItems[selectedKey || state.defaultClass]
    ) {
      state.title = (
        <span className="text-muted">
          {t('plugin__pipelines-console-plugin~Select StorageClass')}
        </span>
      );
    }

    const selectedItem = unorderedItems[selectedKey || state.defaultClass];
    if (selectedItem) {
      state.title = this.getTitle(selectedItem);
    }

    Object.keys(unorderedItems)
      .sort()
      .forEach((key) => {
        state.items[key] = unorderedItems[key];
      });
    this.setState(state);
  }

  componentDidMount() {
    const { defaultClass } = this.state;
    if (defaultClass) {
      this.onChange(defaultClass);
    }
  }

  componentDidUpdate() {
    const { defaultClass, selectedKey } = this.state;
    if (selectedKey) {
      this.onChange(selectedKey);
    } else if (defaultClass) {
      this.onChange(defaultClass);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.state, nextState);
  }

  autocompleteFilter = (text, item) => fuzzy(text, item.props.name);

  getTitle = (storageClass) => {
    return storageClass.kindLabel ? (
      <ResourceName kind="StorageClass" name={storageClass.name} />
    ) : (
      <span>{storageClass.name}</span>
    );
  };

  onChange = (key) => {
    const storageClass = _.get(this.state, ['items', key], {});
    this.setState(
      {
        selectedKey: key,
        title: this.getTitle(storageClass),
      },
      () => this.props.onChange(storageClass.resource),
    );
  };

  render() {
    const { id, loaded, describedBy, noSelection, t } = this.props;
    const items = {};
    _.each(
      this.state.items,
      (props, key) =>
        (items[key] = key ? (
          <StorageClassDropdownEntry {...props} />
        ) : (
          <StorageClassDropdownNoStorageClassOption {...props} />
        )),
    );

    const { selectedKey, defaultClass } = this.state;

    // Only show the dropdown if 'no storage class' is not the only option which depends on defaultClass
    const itemsAvailableToShow = defaultClass || _.size(items) > 1;
    return (
      <>
        {loaded && itemsAvailableToShow && (
          <div>
            <label
              className={classNames('control-label', this.props.hideClassName, {
                'co-required': this.props.required,
              })}
              htmlFor={id}
            >
              {t('plugin__pipelines-console-plugin~StorageClass')}
            </label>
            <Dropdown
              className="co-storage-class-dropdown"
              dropDownClassName="dropdown--full-width"
              autocompleteFilter={this.autocompleteFilter}
              autocompletePlaceholder={t(
                'plugin__pipelines-console-plugin~Select StorageClass',
              )}
              items={items}
              selectedKey={selectedKey}
              title={this.state.title}
              onChange={this.onChange}
              id={id}
              dataTest={this.props?.['data-test']}
              noSelection={noSelection}
              menuClassName="dropdown-menu--text-wrap"
            />
            {describedBy && (
              <p className="help-block" id={describedBy}>
                {t(
                  'plugin__pipelines-console-plugin~StorageClass for the new claim',
                )}
              </p>
            )}
          </div>
        )}
      </>
    );
  }
}

export const StorageClassDropdownInner = withTranslation()(
  StorageClassDropdownInnerWithTranslation,
);

export const StorageClassDropdown = (props) => {
  const storageClassResources = useK8sWatchResources({
    StorageClass: {
      kind: 'StorageClass',
      isList: true,
    },
  });
  return (
    <StorageClassDropdownInner
      {...props}
      storageClass={storageClassResources.StorageClass}
      loaded={storageClassResources.StorageClass.loaded}
    />
  );
};
