import * as React from 'react';
import * as classNames from 'classnames';

import './DynamicResourceLinkList.scss';
import PipelineResourceRef from './PipelineResourceRef';

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
  disableLink?: boolean;
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
    return <>{'-'}</>;
  }
  return (
    <div
      className={classNames('odc-dynamic-resource-link-list', {
        'odc-dynamic-resource-link-list--addSpaceBelow': !removeSpaceBelow,
      })}
    >
      {title && <div>{title}</div>}
      <div>
        {links.map(
          ({ name, resourceKind, qualifier = '', disableLink = false }) => {
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
                  namespace={namespace}
                  disableLink={disableLink}
                />
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};

export default DynamicResourceLinkList;
