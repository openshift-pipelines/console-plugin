import { fireEvent, render, screen } from '@testing-library/react';
import { dump, load } from 'js-yaml';
import type { ReactNode } from 'react';
import { typeChecks } from '../../utils/type-guards';
import {
  SyncedResourceEditor,
  SyncedResourceEditorAdapter,
  useSyncedResourceEditor,
} from '..';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { dump: dumpYAML } =
    jest.requireActual<typeof import('js-yaml')>('js-yaml');

  const ResourceYAMLEditor = ({
    initialResource,
    onChange,
  }: {
    initialResource: unknown;
    onChange: (yaml: string) => void;
  }) => {
    const [value, setValue] = React.useState(() => dumpYAML(initialResource));

    return (
      <textarea
        aria-label="YAML view"
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          setValue(nextValue);
          onChange(nextValue);
        }}
        value={value}
      />
    );
  };

  return {
    ResourceYAMLEditor,
    DocumentTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

type ExampleFormData = {
  name: string;
  size: string;
};

type ExampleResource = {
  apiVersion: string;
  kind: string;
  metadata: { name: string };
  spec: { size: string; yamlOnly?: string };
};

const initialResource: ExampleResource = {
  apiVersion: 'example.dev/v1',
  kind: 'Example',
  metadata: { name: 'initial-name' },
  spec: { size: 'small', yamlOnly: 'keep-me' },
};

const isExampleResource = (value: unknown): value is ExampleResource =>
  typeChecks.isRecord(value) &&
  value.apiVersion === initialResource.apiVersion &&
  value.kind === initialResource.kind &&
  typeChecks.isRecord(value.metadata) &&
  typeChecks.isString(value.metadata.name) &&
  typeChecks.isRecord(value.spec) &&
  typeChecks.isString(value.spec.size);

const adapter: SyncedResourceEditorAdapter<ExampleFormData, ExampleResource> = {
  resourceToForm: (resource) => ({
    name: resource.metadata.name,
    size: resource.spec.size,
  }),
  formToResource: (formData, resource) => ({
    ...resource,
    metadata: { ...resource.metadata, name: formData.name },
    spec: { ...resource.spec, size: formData.size },
  }),
  yamlToResource: (yaml) => {
    const resource = load(yaml);
    if (!isExampleResource(resource)) {
      throw new Error('YAML does not describe an Example resource.');
    }
    return resource;
  },
  resourceToYAML: (resource) => dump(resource, { noRefs: true }),
};

const ExampleFields = () => {
  const { formData, setFormData } = useSyncedResourceEditor<
    ExampleFormData,
    ExampleResource
  >();

  return (
    <>
      <label htmlFor="example-name">Name</label>
      <input
        id="example-name"
        onChange={(event) =>
          setFormData({ ...formData, name: event.currentTarget.value })
        }
        value={formData.name}
      />
      <label htmlFor="example-size">Size</label>
      <input
        id="example-size"
        onChange={(event) =>
          setFormData({ ...formData, size: event.currentTarget.value })
        }
        value={formData.size}
      />
    </>
  );
};

const renderEditor = (
  onResourceChange = jest.fn(),
  resource = initialResource,
  title?: string,
) => {
  render(
    <SyncedResourceEditor
      adapter={adapter}
      initialResource={resource}
      onResourceChange={onResourceChange}
      title={title}
    >
      <ExampleFields />
    </SyncedResourceEditor>,
  );
  return onResourceChange;
};

const openYAML = () =>
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));

const openForm = () =>
  fireEvent.click(screen.getByRole('radio', { name: 'Form view' }));

const yamlEditor = () => screen.getByRole('textbox', { name: 'YAML view' });

describe('SyncedResourceEditor', () => {
  it('renders an optional page title', () => {
    renderEditor(jest.fn(), initialResource, 'Create Example');

    expect(
      screen.getByRole('heading', { name: 'Create Example' }),
    ).toBeTruthy();
  });

  it('initializes from the resource supplied by a page', () => {
    renderEditor(jest.fn(), {
      ...initialResource,
      metadata: { name: 'existing-resource' },
      spec: { size: 'large', yamlOnly: 'already-present' },
    });

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'existing-resource',
    );
    expect((screen.getByLabelText('Size') as HTMLInputElement).value).toBe(
      'large',
    );
  });

  it('renders children in Form mode', () => {
    renderEditor();

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'initial-name',
    );
    expect((screen.getByLabelText('Size') as HTMLInputElement).value).toBe(
      'small',
    );
    expect(screen.queryByRole('textbox', { name: 'YAML view' })).toBeNull();
  });

  it('updates the complete resource and generated YAML after Form changes', () => {
    const onResourceChange = renderEditor();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'changed-in-form' },
    });

    expect(onResourceChange).toHaveBeenLastCalledWith({
      ...initialResource,
      metadata: { name: 'changed-in-form' },
    });

    openYAML();
    expect((yamlEditor() as HTMLTextAreaElement).value).toContain(
      'name: changed-in-form',
    );
  });

  it('updates Form values from valid YAML', () => {
    renderEditor();
    openYAML();
    fireEvent.change(yamlEditor(), {
      target: {
        value: dump({
          ...initialResource,
          metadata: { name: 'changed-in-yaml' },
          spec: { size: 'large', yamlOnly: 'set-in-yaml' },
        }),
      },
    });

    openForm();

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'changed-in-yaml',
    );
    expect((screen.getByLabelText('Size') as HTMLInputElement).value).toBe(
      'large',
    );
  });

  it('retains YAML-only settings after Form changes', () => {
    renderEditor();
    openYAML();
    fireEvent.change(yamlEditor(), {
      target: {
        value: dump({
          ...initialResource,
          spec: { size: 'small', yamlOnly: 'set-in-yaml' },
        }),
      },
    });
    openForm();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'form-name' },
    });
    openYAML();

    expect(load((yamlEditor() as HTMLTextAreaElement).value)).toEqual({
      ...initialResource,
      metadata: { name: 'form-name' },
      spec: { size: 'small', yamlOnly: 'set-in-yaml' },
    });
  });

  it('does not let invalid YAML replace the last valid Form state', () => {
    const onResourceChange = renderEditor();
    openYAML();
    const validYAML = dump({
      ...initialResource,
      metadata: { name: 'last-valid-name' },
    });
    fireEvent.change(yamlEditor(), { target: { value: validYAML } });
    expect(onResourceChange).toHaveBeenLastCalledWith({
      ...initialResource,
      metadata: { name: 'last-valid-name' },
    });

    fireEvent.change(yamlEditor(), { target: { value: 'apiVersion: [' } });
    openForm();

    expect(screen.getByText('Invalid YAML cannot be persisted')).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(onResourceChange).toHaveBeenLastCalledWith({
      ...initialResource,
      metadata: { name: 'last-valid-name' },
    });

    fireEvent.change(yamlEditor(), { target: { value: validYAML } });
    openForm();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'last-valid-name',
    );
  });
});
