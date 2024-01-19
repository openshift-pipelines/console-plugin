import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import * as classNames from 'classnames';
import {
  getReference,
  getReferenceForModel,
} from '../pipelines-overview/utils';
import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';

export type ResourceLinkProps = {
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
  className?: string;
  displayName?: string;
  inline?: boolean;
  linkTo?: boolean;
  name?: string;
  namespace?: string;
  hideIcon?: boolean;
  title?: string;
  dataTest?: string;
  onClick?: () => void;
  truncate?: boolean;
  nameSuffix?: React.ReactNode;
  children?: React.ReactNode;
  model?: K8sModel;
};

export const resourcePathFromModel = (
  model: K8sModel,
  name?: string,
  namespace?: string,
) => {
  const { plural, namespaced, crd } = model;

  let url = '/k8s/';

  if (!namespaced) {
    url += 'cluster/';
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/';
  }

  if (crd) {
    url += getReferenceForModel(model);
  } else if (plural) {
    url += plural;
  }

  if (name) {
    // Some resources have a name that needs to be encoded. For instance,
    // Users can have special characters in the name like `#`.
    url += `/${encodeURIComponent(name)}`;
  }

  return url;
};

/**
 * NOTE: This will not work for runtime-defined resources. Use a `connect`-ed component like `ResourceLink` instead.
 */
export const resourcePath = (
  model: K8sModel,
  name?: string,
  namespace?: string,
) => {
  return resourcePathFromModel(model, name, namespace);
};

export const ResourceLinkWithIcon: React.FC<ResourceLinkProps> = ({
  className,
  displayName,
  inline = false,
  kind,
  groupVersionKind,
  linkTo = true,
  name,
  nameSuffix,
  namespace,
  hideIcon,
  title,
  children,
  dataTest,
  onClick,
  truncate,
  model,
}) => {
  if (!kind && !groupVersionKind) {
    return null;
  }
  const kindReference = groupVersionKind
    ? getReference(groupVersionKind)
    : kind;
  const path = linkTo ? resourcePath(model, name, namespace) : undefined;
  const value = displayName ? displayName : name;
  const classes = classNames('co-resource-item', className, {
    'co-resource-item--inline': inline,
    'co-resource-item--truncate': truncate,
  });

  return (
    <span className={classes}>
      {!hideIcon && <ResourceIcon kind={kindReference} />}
      {path ? (
        <Link
          to={path}
          title={title}
          className="co-resource-item__resource-name"
          data-test-id={value}
          data-test={dataTest ?? value}
          onClick={onClick}
        >
          {value}
          {nameSuffix}
        </Link>
      ) : (
        <span
          className="co-resource-item__resource-name"
          data-test-id={value}
          data-test={dataTest ?? value}
        >
          {value}
          {nameSuffix}
        </span>
      )}
      {children}
    </span>
  );
};

ResourceLinkWithIcon.displayName = 'ResourceLinkWithIcon';
