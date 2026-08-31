import type { FC } from 'react';
import classNames from 'classnames';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import PipelineResourceRef from './PipelineResourceRef';

import './DynamicResourceLinkList.scss';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { getResourceModelFromTaskKind } from '../utils/pipeline-augment';
import { getGroupVersionKindForModel } from '@openshift-console/dynamic-plugin-sdk';

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
  openInNewTab?: boolean;
};

const DynamicResourceLinkList: FC<DynamicResourceLinkListProps> = ({
  links = [],
  namespace,
  title,
  removeSpaceBelow,
  openInNewTab = false,
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
      <DescriptionList>
        <DescriptionListGroup>
          {title && <DescriptionListTerm>{title}</DescriptionListTerm>}
          <DescriptionListDescription>
            {links.map(
              ({
                name,
                resourceKind,
                qualifier = '',
                disableLink = false,
                namespace: namespaceForTask,
                resourceApiVersion = '',
              }) => {
                let linkName = qualifier;
                if (qualifier?.length > 0 && name !== qualifier) {
                  linkName += ` (${name})`;
                }
                const model = getResourceModelFromTaskKind(resourceKind);
                return (
                  <div key={`${resourceKind}/${linkName}`}>
                    {openInNewTab ? (
                      <ResourceLinkWithIcon
                        groupVersionKind={getGroupVersionKindForModel(model)}
                        model={model}
                        name={name}
                        displayName={linkName}
                        namespace={namespaceForTask || namespace}
                        openInNewTab
                        linkTo={!disableLink}
                      />
                    ) : (
                      <PipelineResourceRef
                        resourceKind={resourceKind}
                        resourceName={name}
                        displayName={linkName}
                        namespace={namespaceForTask || namespace}
                        disableLink={disableLink}
                        resourceApiVersion={resourceApiVersion}
                      />
                    )}
                  </div>
                );
              },
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};

export default DynamicResourceLinkList;
