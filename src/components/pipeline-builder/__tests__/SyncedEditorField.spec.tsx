import { render, screen, fireEvent } from '@testing-library/react';
import { dump } from 'js-yaml';
import SyncedEditorField from '../SyncedEditorField';
import { EditorType } from '../types';

const mockSetFieldValue = jest.fn();
const mockSetStatus = jest.fn();
let mockFieldValue = EditorType.Form;
let mockFormValues: Record<string, any> = {};

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: mockFieldValue }, {}, {}]),
  useFormikContext: jest.fn(() => ({
    values: mockFormValues,
    setFieldValue: mockSetFieldValue,
    setStatus: mockSetStatus,
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../RadioGroupField', () => ({
  __esModule: true,
  default: () => <div data-testid="radio-group" />,
}));

const yamlWithTasks = dump({
  spec: {
    tasks: [{ name: 'build', taskRef: { name: 'buildah' } }],
  },
});

const yamlWithoutTasks = dump({
  spec: {
    tasks: [],
  },
});

const yamlNoTasksField = dump({
  spec: {
    params: [{ name: 'repo-url' }],
  },
});

const formContextBase = {
  name: 'formData',
  editor: <div data-testid="form-editor" />,
};

const yamlContextBase = {
  name: 'yamlData',
  editor: <div data-testid="yaml-editor" />,
};

const getToggle = () => screen.getByRole('switch');

describe('SyncedEditorField', () => {
  let mockSetHideOptionalTaskParam: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetHideOptionalTaskParam = jest.fn();
    mockFieldValue = EditorType.Form;
    localStorage.setItem('pipeline-console-plugin-editorType', EditorType.Form);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderComponent = (overrides: Record<string, any> = {}) =>
    render(
      <SyncedEditorField
        name="editorType"
        formContext={formContextBase}
        yamlContext={yamlContextBase}
        lastViewUserSettingKey="test-key"
        hideOptionalTaskParam={false}
        setHideOptionalTaskParam={mockSetHideOptionalTaskParam}
        {...overrides}
      />,
    );

  describe('optional task param toggle', () => {
    it('should render the toggle switch', () => {
      mockFormValues = { formData: { tasks: [] }, yamlData: '' };
      renderComponent();

      expect(screen.getByText('Show required task params only')).toBeTruthy();
    });

    it('should disable toggle when form mode has no tasks', () => {
      mockFormValues = { formData: { tasks: [] }, yamlData: '' };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(true);
    });

    it('should enable toggle when form mode has tasks', () => {
      mockFormValues = {
        formData: {
          tasks: [{ name: 'build', taskRef: { name: 'buildah' } }],
        },
        yamlData: '',
      };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(false);
    });

    it('should disable toggle when formData.tasks is undefined', () => {
      mockFormValues = { formData: {}, yamlData: '' };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(false);
    });

    it('should disable toggle when formData is undefined', () => {
      mockFormValues = { yamlData: '' };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(false);
    });

    it('should disable toggle when YAML mode has no tasks', () => {
      mockFieldValue = EditorType.YAML;
      localStorage.setItem(
        'pipeline-console-plugin-editorType',
        EditorType.YAML,
      );
      mockFormValues = { formData: {}, yamlData: yamlWithoutTasks };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(true);
    });

    it('should enable toggle when YAML mode has tasks', () => {
      mockFieldValue = EditorType.YAML;
      localStorage.setItem(
        'pipeline-console-plugin-editorType',
        EditorType.YAML,
      );
      mockFormValues = { formData: {}, yamlData: yamlWithTasks };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(false);
    });

    it('should disable toggle when YAML has no tasks field at all', () => {
      mockFieldValue = EditorType.YAML;
      localStorage.setItem(
        'pipeline-console-plugin-editorType',
        EditorType.YAML,
      );
      mockFormValues = { formData: {}, yamlData: yamlNoTasksField };
      renderComponent();

      expect(getToggle().hasAttribute('disabled')).toBe(true);
    });

    it('should call setHideOptionalTaskParam when toggled', () => {
      mockFormValues = {
        formData: {
          tasks: [{ name: 'build', taskRef: { name: 'buildah' } }],
        },
        yamlData: '',
      };
      renderComponent();

      fireEvent.click(getToggle());

      expect(mockSetHideOptionalTaskParam).toHaveBeenCalledWith(true);
    });

    it('should reflect hideOptionalTaskParam checked state', () => {
      mockFormValues = {
        formData: {
          tasks: [{ name: 'build', taskRef: { name: 'buildah' } }],
        },
        yamlData: '',
      };
      renderComponent({ hideOptionalTaskParam: true });

      expect((getToggle() as HTMLInputElement).checked).toBe(true);
    });
  });
});
