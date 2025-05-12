import * as React from 'react';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { RouteTemplate } from '../utils/triggers';
import './TriggerTemplateResourceLink.scss';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { K8sKind, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

type TriggerTemplateResourceLinkProps = {
  namespace: string;
  model: K8sKind;
  links: RouteTemplate[];
};
const TriggerTemplateResourceLink: React.FC<
  TriggerTemplateResourceLinkProps
> = ({ links = [], namespace, model }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const title = t(model.labelPluralKey);
  const kind = getReferenceForModel(model);

  if (links.length === 0) {
    return null;
  }
  return (
    <DescriptionList className="odc-trigger-template-list">
      <DescriptionListGroup>
        <DescriptionListTerm>{title}</DescriptionListTerm>
        {links.map(({ routeURL, triggerTemplateName }) => {
          return (
            <DescriptionListDescription key={triggerTemplateName}>
              <ResourceLink
                kind={kind}
                name={triggerTemplateName}
                namespace={namespace}
                title={triggerTemplateName}
                inline
              />
              {routeURL && (
                <div>
                  <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>
                    {routeURL}
                  </ClipboardCopy>
                </div>
              )}
            </DescriptionListDescription>
          );
        })}
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default TriggerTemplateResourceLink;
