import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Level, LevelItem, Title } from '@patternfly/react-core';
import MonacoEditor from 'react-monaco-editor';
import { ChevronDownIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-down-icon';
import { ChevronRightIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-right-icon';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { PasteIcon } from '@patternfly/react-icons/dist/esm/icons/paste-icon';
import { useTranslation } from 'react-i18next';
import { referenceFor } from '../../utils/k8s-utils';
import { Sample } from '../types';
import { FirehoseResult, K8sKind } from '@openshift-console/dynamic-plugin-sdk';

const ResourceSidebarSample: React.FC<ResourceSidebarSampleProps> = ({
  sample,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  const { highlightText, title, img, description, id, yaml, targetResource } =
    sample;
  const reference = referenceFor(targetResource);
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <li className="co-resource-sidebar-item">
      <Title headingLevel="h3" size="lg" className="pf-v5-u-mb-sm">
        <span className="pf-v5-u-text-transform-uppercase">
          {highlightText}
        </span>{' '}
        {title}
      </Title>
      {img && (
        <img
          src={img}
          className="co-resource-sidebar-item__img img-responsive"
        />
      )}
      <p>{description}</p>
      <Level>
        <LevelItem>
          <Button
            type="button"
            variant="link"
            data-test="load-sample"
            isInline
            onClick={() => loadSampleYaml(id, yaml, reference)}
          >
            <PasteIcon className="co-icon-space-r" />
            {t('Try it')}
          </Button>
        </LevelItem>
        <LevelItem>
          <Button
            type="button"
            variant="link"
            data-test="download-sample"
            isInline
            onClick={() => downloadSampleYaml(id, yaml, reference)}
          >
            <DownloadIcon className="co-icon-space-r" />
            {t('Download YAML')}
          </Button>
        </LevelItem>
      </Level>
    </li>
  );
};

const lineHeight = 18;
const PreviewYAML = ({ maxPreviewLines = 20, yaml }) => {
  return (
    <div style={{ paddingTop: 10 }}>
      <MonacoEditor
        height={Math.min(yaml.split('\n').length, maxPreviewLines) * lineHeight}
        language="yaml"
        value={yaml}
        theme="console-dark"
        options={{
          lineHeight,
          readOnly: true,
          folding: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

interface ResourceSidebarSnippetProps {
  snippet: Sample;
  insertSnippetYaml: (id: string, yaml: string, reference: string) => void;
}

const ResourceSidebarSnippet: React.FC<ResourceSidebarSnippetProps> = ({
  snippet,
  insertSnippetYaml,
}) => {
  const {
    highlightText,
    title,
    id,
    yaml,
    lazyYaml,
    targetResource,
    description,
  } = snippet;

  const [yamlPreview, setYamlPreview] = React.useState<string>(yaml);
  const [yamlPreviewOpen, setYamlPreviewOpen] = React.useState(false);

  const resolveYaml = async (callback: (resolvedYaml: string) => void) => {
    if (yaml) {
      callback(yaml);
    } else if (lazyYaml) {
      try {
        callback(await lazyYaml());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          `Error while running lazy yaml snippet ${id} (${title})`,
          error,
        );
      }
    }
  };

  const insertSnippet = () => {
    const reference = referenceFor(targetResource);
    resolveYaml((resolvedYaml) =>
      insertSnippetYaml(id, resolvedYaml, reference),
    );
  };

  const toggleYamlPreview = () => {
    setYamlPreviewOpen((open) => !open);
    if (!yamlPreview && !yamlPreviewOpen) {
      resolveYaml((resolvedYaml) => setYamlPreview(resolvedYaml));
    }
  };

  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <li className="co-resource-sidebar-item">
      <Title headingLevel="h3" size="lg" className="pf-v5-u-mb-sm">
        <span className="pf-v5-u-text-transform-uppercase">
          {highlightText}
        </span>{' '}
        {title}
      </Title>
      <p>{description}</p>
      <Level>
        <LevelItem>
          <Button type="button" variant="link" isInline onClick={insertSnippet}>
            <PasteIcon className="co-icon-space-r" />
            {t('Insert snippet')}
          </Button>
        </LevelItem>
        <LevelItem>
          <Button
            type="button"
            variant="link"
            isInline
            onClick={toggleYamlPreview}
          >
            {yamlPreviewOpen ? (
              <>
                {t('Hide YAML')}
                <ChevronDownIcon className="co-icon-space-l" />
              </>
            ) : (
              <>
                {t('Show YAML')}
                <ChevronRightIcon className="co-icon-space-l" />
              </>
            )}
          </Button>
        </LevelItem>
      </Level>
      {yamlPreviewOpen && yamlPreview && <PreviewYAML yaml={yamlPreview} />}
    </li>
  );
};

interface ResourceSidebarSnippetsProps {
  snippets: Sample[];
  insertSnippetYaml(id: string, yaml: string, reference: string);
}

export const ResourceSidebarSnippets: React.FC<
  ResourceSidebarSnippetsProps
> = ({ snippets, insertSnippetYaml }) => {
  return (
    <ul
      className="co-resource-sidebar-list"
      style={{ listStyle: 'none', paddingLeft: 0 }}
    >
      {_.map(_.sortBy(snippets, 'title'), (snippet) => (
        <ResourceSidebarSnippet
          key={snippet.id}
          snippet={snippet}
          insertSnippetYaml={insertSnippetYaml}
        />
      ))}
    </ul>
  );
};

export const ResourceSidebarSamples: React.FC<ResourceSidebarSamplesProps> = ({
  samples,
  loadSampleYaml,
  downloadSampleYaml,
}) => {
  return (
    <ol className="co-resource-sidebar-list" data-test="resource-samples-list">
      {_.map(_.sortBy(samples, 'title'), (sample) => (
        <ResourceSidebarSample
          key={sample.id}
          sample={sample}
          loadSampleYaml={loadSampleYaml}
          downloadSampleYaml={downloadSampleYaml}
        />
      ))}
    </ol>
  );
};

export type LoadSampleYaml = (id: string, yaml: string, kind: string) => void;

export type DownloadSampleYaml = (
  id: string,
  yaml: string,
  kind: string,
) => void;

type ResourceSidebarSampleProps = {
  sample: Sample;
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
};

type ResourceSidebarSamplesProps = {
  samples: Sample[];
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
  yamlSamplesList?: FirehoseResult;
  kindObj: K8sKind;
};
