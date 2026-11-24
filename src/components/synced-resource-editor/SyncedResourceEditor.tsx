import type { FC, SetStateAction } from 'react';
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import { Alert, Radio, Title } from '@patternfly/react-core';
import {
  DocumentTitle,
  K8sResourceKind,
  ResourceYAMLEditor,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '../status/status-box';
import {
  EditorMode,
  SyncedResourceEditorAdapter,
  SyncedResourceEditorContextValue,
  SyncedResourceEditorProps,
} from './types';
import './SyncedResourceEditor.scss';

const SyncedResourceEditorContext = createContext<
  SyncedResourceEditorContextValue<unknown, unknown> | undefined
>(undefined);

/**
 * Gives resource-specific form fields access to the current form values and
 * a setter that keeps the complete resource and YAML in sync.
 */
export const useSyncedResourceEditor = <FormData, Resource>() => {
  const context = useContext(SyncedResourceEditorContext);
  if (!context) {
    throw new Error(
      'useSyncedResourceEditor must be used inside SyncedResourceEditor.',
    );
  }
  return context as SyncedResourceEditorContextValue<FormData, Resource>;
};

const DefaultYAMLEditor: FC<{
  resource: K8sResourceKind;
  onChange: (yaml: string) => void;
  isCreate: boolean;
}> = ({ resource, onChange, isCreate }) => {
  return (
    <div className="pipelines-console-plugin-synced-resource-editor__yaml">
      <Suspense fallback={<LoadingBox />}>
        <ResourceYAMLEditor
          create={isCreate}
          hideHeader={isCreate}
          initialResource={resource}
          onChange={onChange}
          // Resource creation and updates belong to the page. Until a page
          // provides that action, prevent the Console editor from making its
          // own Kubernetes API request.
          onSave={onChange}
        />
      </Suspense>
    </div>
  );
};

export const SyncedResourceEditor = <FormData, Resource>({
  adapter,
  children,
  initialResource,
  initialMode = EditorMode.Form,
  isCreate = false,
  onResourceChange,
  renderYAMLEditor,
  title,
}: SyncedResourceEditorProps<FormData, Resource>) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const editorId = useId();
  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode);
  const [resource, setResource] = useState<Resource>(initialResource);
  const [formData, setFormDataState] = useState<FormData>(() =>
    adapter.resourceToForm(initialResource),
  );
  const [yaml, setYAML] = useState(() =>
    adapter.resourceToYAML(initialResource),
  );
  const [yamlError, setYAMLError] = useState<string>();
  const resourceRef = useRef(resource);
  const formDataRef = useRef(formData);

  const updateResource = useCallback(
    (nextResource: Resource, nextFormData: FormData) => {
      resourceRef.current = nextResource;
      formDataRef.current = nextFormData;
      setResource(nextResource);
      setFormDataState(nextFormData);
      onResourceChange?.(nextResource);
    },
    [onResourceChange],
  );

  const setFormData = useCallback(
    (nextValue: SetStateAction<FormData>) => {
      const nextFormData =
        typeof nextValue === 'function'
          ? (nextValue as (previous: FormData) => FormData)(formDataRef.current)
          : nextValue;
      const nextResource = adapter.formToResource(
        nextFormData,
        resourceRef.current,
      );

      setYAML(adapter.resourceToYAML(nextResource));
      setYAMLError(undefined);
      updateResource(nextResource, nextFormData);
    },
    [adapter, updateResource],
  );

  const onYAMLChange = useCallback(
    (nextYAML: string) => {
      setYAML(nextYAML);
      try {
        const nextResource = adapter.yamlToResource(nextYAML);
        const nextFormData = adapter.resourceToForm(nextResource);
        setYAMLError(undefined);
        updateResource(nextResource, nextFormData);
      } catch (error) {
        setYAMLError(error instanceof Error ? error.message : String(error));
      }
    },
    [adapter, updateResource],
  );

  const onEditorModeChange = (nextMode: EditorMode) => {
    if (nextMode === EditorMode.Form && yamlError) return;
    setEditorMode(nextMode);
  };

  const contextValue: SyncedResourceEditorContextValue<FormData, Resource> = {
    formData,
    resource,
    setFormData,
  };

  const yamlEditor = renderYAMLEditor?.({
    yaml,
    resource,
    onChange: onYAMLChange,
    error: yamlError,
  }) ?? (
    <DefaultYAMLEditor
      isCreate={isCreate}
      onChange={onYAMLChange}
      resource={resource as K8sResourceKind}
    />
  );

  return (
    <SyncedResourceEditorContext.Provider value={contextValue}>
      <div className="pipelines-console-plugin-synced-resource-editor">
        {title && (
          <>
            <DocumentTitle>{title}</DocumentTitle>
            <Title headingLevel="h1">{title}</Title>
          </>
        )}
        <div
          aria-labelledby={`${editorId}-label`}
          className="pipelines-console-plugin-synced-resource-editor__toggle"
          role="radiogroup"
        >
          <span id={`${editorId}-label`}>{t('Configure via:')}</span>
          <Radio
            id={`${editorId}-form`}
            isChecked={editorMode === EditorMode.Form}
            label={t('Form view')}
            name={`${editorId}-mode`}
            onChange={() => onEditorModeChange(EditorMode.Form)}
            value={EditorMode.Form}
          />
          <Radio
            id={`${editorId}-yaml`}
            isChecked={editorMode === EditorMode.YAML}
            label={t('YAML view')}
            name={`${editorId}-mode`}
            onChange={() => onEditorModeChange(EditorMode.YAML)}
            value={EditorMode.YAML}
          />
        </div>
        {editorMode === EditorMode.Form ? children : yamlEditor}
        {editorMode === EditorMode.YAML && yamlError && (
          <Alert
            className="pipelines-console-plugin-synced-resource-editor__yaml-error"
            isInline
            title={t('Invalid YAML cannot be persisted')}
            variant="danger"
          >
            {yamlError}
          </Alert>
        )}
      </div>
    </SyncedResourceEditorContext.Provider>
  );
};

export type { SyncedResourceEditorAdapter };
