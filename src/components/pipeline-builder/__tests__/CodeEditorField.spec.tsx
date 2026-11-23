import { render, waitFor } from '@testing-library/react';
import { ClusterQueueModel } from '../../../models';
import CodeEditorField from '../CodeEditorField';

const mockSetFieldValue = jest.fn();
const mockSetStatus = jest.fn();
let mockOnChange: (yaml: string) => void = jest.fn();

jest.mock('formik', () => ({
  useField: jest.fn(() => [
    { value: 'apiVersion: v1\nkind: Pipeline' },
    {},
    {},
  ]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: mockSetFieldValue,
    setStatus: mockSetStatus,
  })),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return {
    CodeEditor: React.forwardRef(({ onChange }: any, ref: any) => {
      mockOnChange = onChange;
      return <div data-testid="code-editor" ref={ref} />;
    }),
    useK8sWatchResource: jest.fn(() => [[], true, null]),
    useResolvedExtensions: jest.fn(() => [[]]),
    isYAMLTemplate: jest.fn(),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../utils', () => ({
  getResourceSidebarSamples: jest.fn(() => ({ samples: [], snippets: [] })),
}));

jest.mock('../swagger', () => ({
  fetchSwagger: jest.fn(),
  getSwaggerDefinitions: jest.fn(),
  definitionFor: jest.fn(),
}));

const {
  fetchSwagger: mockFetchSwagger,
  getSwaggerDefinitions: mockGetSwaggerDefinitions,
  definitionFor: mockDefinitionFor,
} = jest.requireMock('../swagger');

jest.mock('../CodeEditorSidebar', () => ({
  __esModule: true,
  default: () => null,
}));

describe('CodeEditorField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSwaggerDefinitions.mockReturnValue(undefined);
    mockFetchSwagger.mockResolvedValue({});
    mockDefinitionFor.mockReturnValue({ properties: [] });
  });

  it('loads OpenAPI definitions before resolving a resource schema', async () => {
    render(
      <CodeEditorField
        name="yamlData"
        showSamples={false}
        model={ClusterQueueModel}
      />,
    );

    expect(mockDefinitionFor).not.toHaveBeenCalled();
    expect(mockFetchSwagger).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mockDefinitionFor).toHaveBeenCalledWith(ClusterQueueModel),
    );
  });

  it('should reset submitError when YAML content changes', () => {
    render(<CodeEditorField name="yamlData" showSamples={false} />);

    mockOnChange('apiVersion: v1\nkind: Pipeline\nmetadata:\n  name: test');

    expect(mockSetFieldValue).toHaveBeenCalledWith(
      'yamlData',
      'apiVersion: v1\nkind: Pipeline\nmetadata:\n  name: test',
    );
    expect(mockSetStatus).toHaveBeenCalledWith({ submitError: '' });
  });

  it('should reset submitError on every YAML edit', () => {
    render(<CodeEditorField name="yamlData" showSamples={false} />);

    mockOnChange('edit 1');
    expect(mockSetStatus).toHaveBeenCalledWith({ submitError: '' });

    jest.clearAllMocks();

    mockOnChange('edit 2');
    expect(mockSetStatus).toHaveBeenCalledWith({ submitError: '' });
  });

  it('should consistently reset submitError after re-renders (simulating editor toggle)', () => {
    const { rerender } = render(
      <CodeEditorField name="yamlData" showSamples={false} />,
    );

    // First edit - simulate user making invalid YAML
    mockOnChange('invalid yaml');
    expect(mockSetStatus).toHaveBeenCalledWith({ submitError: '' });

    jest.clearAllMocks();

    // Simulate re-render that would occur during view toggle
    rerender(<CodeEditorField name="yamlData" showSamples={false} />);

    // Edit after "returning" to YAML view - should still reset error
    mockOnChange('apiVersion: v1\nkind: Pipeline');
    expect(mockSetFieldValue).toHaveBeenCalledWith(
      'yamlData',
      'apiVersion: v1\nkind: Pipeline',
    );
    expect(mockSetStatus).toHaveBeenCalledWith({ submitError: '' });
  });
});
