import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { FormikValues, useField, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { JSONSchema7 } from 'json-schema';
import { useTranslation } from 'react-i18next';
import { getReferenceForModel } from '../pipelines-overview/utils';
import {
  CodeEditor,
  isYAMLTemplate,
  K8sKind,
  K8sResourceCommon,
  useK8sWatchResource,
  useResolvedExtensions,
  WatchK8sResource,
  YAMLTemplate,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleYAMLSampleModel } from '../../models';
import { FieldProps } from '../pipelines-details/multi-column-field/types';
import { getResourceSidebarSamples } from './utils';
import CodeEditorSidebar from './CodeEditorSidebar';
import { definitionFor } from './swagger';

import './CodeEditorField.scss';

export interface CodeEditorFieldProps extends FieldProps {
  model?: K8sKind;
  minHeight?: string;
  language?: string;
  schema?: JSONSchema7;
  showSamples: boolean;
  showShortcuts?: boolean;
  showMiniMap?: boolean;
  onSave?: () => void;
}

const SampleResource: WatchK8sResource = {
  kind: getReferenceForModel(ConsoleYAMLSampleModel),
  isList: true,
};

const CodeEditorField: React.FC<CodeEditorFieldProps> = ({
  name,
  label,
  model,
  schema,
  showSamples,
  showShortcuts,
  showMiniMap,
  minHeight,
  onSave,
  language,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const { t } = useTranslation();
  const editorRef = React.useRef();

  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);

  const [sampleResources, loaded, loadError] =
    useK8sWatchResource<K8sResourceCommon[]>(SampleResource);

  const { samples, snippets } = model
    ? getResourceSidebarSamples(model, {
        data: sampleResources,
        loaded,
        loadError,
      })
    : { samples: [], snippets: [] };

  const definition = model ? definitionFor(model) : { properties: [] };
  const hasSchema =
    !!schema || (!!definition && !isEmpty(definition.properties));
  const hasSidebarContent =
    hasSchema || (showSamples && !isEmpty(samples)) || !isEmpty(snippets);

  const [templateExtensions] =
    useResolvedExtensions<YAMLTemplate>(isYAMLTemplate);

  const sanitizeYamlContent = React.useCallback(
    (id = 'default', yaml = '', kind: string) => {
      if (yaml) {
        return yaml;
      }
      return '';
    },
    [templateExtensions],
  );

  return (
    <div className="osc-yaml-editor" data-test="yaml-editor">
      <div className="osc-yaml-editor__editor">
        {/* <AsyncComponent
          loader={() => import(CodeEditor).then((c) => c.default)}
          forwardRef={editorRef}
          value={field.value}
          minHeight={minHeight ?? '200px'}
          onChange={(yaml: string) => setFieldValue(name, yaml)}
          onSave={onSave}
          showShortcuts={showShortcuts}
          showMiniMap={showMiniMap}
          language={language}
          toolbarLinks={
            !sidebarOpen &&
            hasSidebarContent && [
              <Button
                isInline
                variant="link"
                onClick={() => setSidebarOpen(true)}
                key=""
              >
                <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                {t('console-shared~View sidebar')}
              </Button>,
            ]
          }
        /> */}
        <CodeEditor
          ref={editorRef}
          value={field.value}
          minHeight={minHeight ?? '200px'}
          onChange={(yaml: string) => setFieldValue(name, yaml)}
          onSave={onSave}
          showShortcuts={showShortcuts}
          showMiniMap={showMiniMap}
          language={language}
          toolbarLinks={
            !sidebarOpen &&
            hasSidebarContent && [
              <Button
                isInline
                variant="link"
                onClick={() => setSidebarOpen(true)}
                key=""
              >
                <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                {t('console-shared~View sidebar')}
              </Button>,
            ]
          }
        />
      </div>
      {sidebarOpen && hasSidebarContent && (
        <div className="osc-yaml-editor__sidebar">
          <CodeEditorSidebar
            editorRef={editorRef}
            model={model}
            schema={schema}
            samples={showSamples ? samples : []}
            snippets={snippets}
            sanitizeYamlContent={sanitizeYamlContent}
            sidebarLabel={label as string}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      )}
    </div>
  );
};

export default CodeEditorField;
