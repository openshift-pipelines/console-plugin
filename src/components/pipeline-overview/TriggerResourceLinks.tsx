import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  getGroupVersionKindForModel,
  K8sKind,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { RouteTemplate } from '../utils/triggers';
import { ExternalLinkWithCopy } from '../utils/link';
import './TriggerResourceLinks.scss';

type TriggerResourceLinksProps = {
  namespace: string;
  model: K8sKind;
  links: RouteTemplate[];
};
const TriggerResourceLinks: React.FC<TriggerResourceLinksProps> = ({
  links = [],
  namespace,
  model,
}) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <DescriptionList>
      {links.map(({ routeURL, triggerTemplateName }) => {
        return (
          <DescriptionListDescription key={triggerTemplateName}>
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(model)}
              name={triggerTemplateName}
              namespace={namespace}
              title={triggerTemplateName}
              inline
            />
            {routeURL && (
              <div className="opp-trigger-template-link">
                <ExternalLinkWithCopy
                  key={routeURL}
                  link={routeURL}
                  text={routeURL}
                />
              </div>
            )}
          </DescriptionListDescription>
        );
      })}
    </DescriptionList>
  );
};

export default TriggerResourceLinks;
