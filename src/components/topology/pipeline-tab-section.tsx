import { GraphElement } from '@patternfly/react-topology';

import React from 'react';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import PipelinesOverview from '../pipeline-overview/PipelineOverview';
import { DetailsTabSectionExtensionHook } from '@openshift-console/dynamic-plugin-sdk';

export const usePipelinesSideBarTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const data = element.getData();
  const resources = data?.resources;
  // This check is based on the properties added through getPipelinesDataModelReconciler
  if (!resources?.pipelines) {
    return [undefined, true, undefined];
  }
  const section = (
    <TopologySideBarTabSection>
      <PipelinesOverview item={resources} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};
