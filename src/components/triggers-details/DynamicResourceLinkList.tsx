import * as React from 'react';
import classNames from 'classnames';
import PipelineResourceRef from './PipelineResourceRef';

import './DynamicResourceLinkList.scss';

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
  disableLink?: boolean;
  namespace?: string;
  resourceApiVersion?: string;
};

type DynamicResourceLinkListProps = {
  links: ResourceModelLink[];
  namespace: string;
  title?: string;
  removeSpaceBelow?: boolean;
};

const DynamicResourceLinkList: React.FC<DynamicResourceLinkListProps> = ({
  links = [],
  namespace,
  title,
  removeSpaceBelow,
}) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <div
      className={classNames('odc-dynamic-resource-link-list', {
        'odc-dynamic-resource-link-list--addSpaceBelow': !removeSpaceBelow,
      })}
    >
      <dl>
        {title && <dt>{title}</dt>}
        <dd>
          {links.map(
            ({
              name,
              resourceKind,
              qualifier = '',
              disableLink = false,
              namespace: namespaceForTask,
              resourceApiVersion,
            }) => {
              let linkName = qualifier;
              if (qualifier?.length > 0 && name !== qualifier) {
                linkName += ` (${name})`;
              }
              return (
                <div key={`${resourceKind}/${linkName}`}>
                  <PipelineResourceRef
                    resourceKind={resourceKind}
                    resourceName={name}
                    displayName={linkName}
                    namespace={namespaceForTask || namespace}
                    disableLink={disableLink}
                    resourceApiVersion={resourceApiVersion}
                  />
                </div>
              );
            },
          )}
        </dd>
      </dl>
    </div>
  );
};

export default DynamicResourceLinkList;
