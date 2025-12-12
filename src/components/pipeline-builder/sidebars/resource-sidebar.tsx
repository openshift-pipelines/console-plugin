import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, Tab, Title } from '@patternfly/react-core';
import {
  ResourceSidebarSnippets,
  ResourceSidebarSamples,
  LoadSampleYaml,
  DownloadSampleYaml,
} from './resource-sidebar-samples';
import { ExploreType } from './explore-type-sidebar';
import { Sample } from '../types';
import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { CloseButton } from '@patternfly/react-component-groups';
import { definitionFor } from '../swagger';
import { SimpleTabNav } from './simple-tab-nav';
import PaneBody from '../../layout/PaneBody';

import '../CodeEditorField.scss';

const sidebarScrollTop = () => {
  document.getElementsByClassName(
    'odc-p-has-sidebar__sidebar',
  )[0].scrollTop = 0;
};

type Tab = {
  name: string;
  component: React.FunctionComponent<{}> | React.ReactElement;
};

const ResourceSidebarWrapper: React.FC<{
  label: string;
  toggleSidebar: () => void;
}> = (props) => {
  const { label, children, toggleSidebar } = props;

  return (
    <div
      className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs"
      data-test="resource-sidebar"
    >
      <PaneBody className="odc-p-has-sidebar__sidebar-body">
        <Flex flexWrap={{ default: 'nowrap' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <Title headingLevel="h2" className="text-capitalize">
              {label}
            </Title>
          </FlexItem>
          <CloseButton onClick={toggleSidebar} />
        </Flex>
        {children}
      </PaneBody>
    </div>
  );
};

const ResourceSchema: React.FC<{ kindObj: K8sKind; schema: any }> = ({
  kindObj,
  schema,
}) => (
  <ExploreType kindObj={kindObj} schema={schema} scrollTop={sidebarScrollTop} />
);

const ResourceSamples: React.FC<{
  samples: Sample[];
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
  kindObj: K8sKind;
}> = ({ samples, kindObj, downloadSampleYaml, loadSampleYaml }) => (
  <ResourceSidebarSamples
    samples={samples}
    kindObj={kindObj}
    downloadSampleYaml={downloadSampleYaml}
    loadSampleYaml={loadSampleYaml}
  />
);

const ResourceSnippets: React.FC<{
  snippets: Sample[];
  insertSnippetYaml(id: string, yaml: string, reference: string);
}> = ({ snippets, insertSnippetYaml }) => (
  <ResourceSidebarSnippets
    snippets={snippets}
    insertSnippetYaml={insertSnippetYaml}
  />
);

export const ResourceSidebar: React.FC<{
  kindObj: K8sKind;
  downloadSampleYaml: DownloadSampleYaml;
  schema: any;
  sidebarLabel: string;
  loadSampleYaml: LoadSampleYaml;
  insertSnippetYaml: (id: string, yaml: string, reference: string) => void;
  toggleSidebar: () => void;
  samples: Sample[];
  snippets: Sample[];
}> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    downloadSampleYaml,
    kindObj,
    schema,
    sidebarLabel,
    loadSampleYaml,
    insertSnippetYaml,
    toggleSidebar,
    samples,
    snippets,
  } = props;
  if (!kindObj && !schema) {
    return null;
  }

  const kindLabel = kindObj?.labelKey ? t(kindObj.labelKey) : kindObj?.label;
  const label = sidebarLabel ? sidebarLabel : kindLabel;

  const showSamples = !_.isEmpty(samples);
  const showSnippets = !_.isEmpty(snippets);

  const definition = kindObj ? definitionFor(kindObj) : { properties: [] };
  const showSchema =
    schema || (definition && !_.isEmpty(definition.properties));

  let tabs: Tab[] = [];
  if (showSamples) {
    tabs.push({
      name: t('Samples'),
      component: ResourceSamples,
    });
  }
  if (showSnippets) {
    tabs.push({
      name: t('Snippets'),
      component: ResourceSnippets,
    });
  }
  if (showSchema) {
    tabs = [
      {
        name: t('Schema'),
        component: ResourceSchema,
      },
      ...tabs,
    ];
  }

  return (
    <ResourceSidebarWrapper label={label} toggleSidebar={toggleSidebar}>
      {tabs.length > 0 ? (
        <SimpleTabNav
          withinSidebar
          noInset
          tabs={tabs}
          tabProps={{
            downloadSampleYaml,
            kindObj,
            schema,
            loadSampleYaml,
            insertSnippetYaml,
            samples,
            snippets,
          }}
          additionalClassNames="pf-v6-u-my-md"
        />
      ) : (
        <ResourceSchema schema={schema} kindObj={kindObj} />
      )}
    </ResourceSidebarWrapper>
  );
};
