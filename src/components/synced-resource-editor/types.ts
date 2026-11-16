import type { ReactNode, SetStateAction } from 'react';

/** The two views supported by a synced resource editor. */
export const EditorMode = {
  Form: 'form',
  YAML: 'yaml',
} as const;

export type EditorMode = (typeof EditorMode)[keyof typeof EditorMode];

/**
 * Resource-specific conversion rules used by {@link SyncedResourceEditor}.
 *
 * `formToResource` receives the last complete resource, rather than a blank
 * object. Implementations should apply only fields represented by the form to
 * that resource. This preserves settings that are available only in YAML.
 */
export type SyncedResourceEditorAdapter<FormData, Resource> = {
  resourceToForm: (resource: Resource) => FormData;
  formToResource: (formData: FormData, resource: Resource) => Resource;
  yamlToResource: (yaml: string) => Resource;
  resourceToYAML: (resource: Resource) => string;
};

export type YAMLRendererProps<Resource = unknown> = {
  yaml: string;
  /** The most recent complete resource, used by resource-aware YAML renderers. */
  resource: Resource;
  onChange: (yaml: string) => void;
  error?: string;
};

export type SyncedResourceEditorContextValue<FormData, Resource> = {
  formData: FormData;
  resource: Resource;
  setFormData: (value: SetStateAction<FormData>) => void;
};

export type SyncedResourceEditorProps<FormData, Resource> = {
  adapter: SyncedResourceEditorAdapter<FormData, Resource>;
  children: ReactNode;
  /** Optional page title when the editor is rendered as the primary page content. */
  title?: string;
  /**
   * A blank resource for Create, or the resource fetched by an Edit page.
   * This value is read when the editor mounts, so Edit pages should render the
   * editor after the resource has loaded.
   */
  initialResource: Resource;
  /** Whether the page creates a new resource rather than editing an existing one. */
  isCreate?: boolean;
  initialMode?: EditorMode;
  /** Called after a valid form or YAML edit produces a complete resource. */
  onResourceChange?: (resource: Resource) => void;
  /**
   * Allows a resource page to customize the default Console YAML editor
   * without taking ownership of synchronization behavior.
   */
  renderYAMLEditor?: (props: YAMLRendererProps<Resource>) => ReactNode;
};
