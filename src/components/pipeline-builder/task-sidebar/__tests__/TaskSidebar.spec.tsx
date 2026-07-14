import { render, screen } from '@testing-library/react';
import { TektonParam, TaskKind, SelectedBuilderTask } from '../../../../types';
import TaskSidebar from '../TaskSidebar';

const mockFieldValue = {
  name: 'my-task',
  taskRef: { name: 'example-task' },
  params: [],
  workspaces: [],
};

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: mockFieldValue }, {}, {}]),
  useFormikContext: jest.fn(() => ({
    values: {},
    setFieldValue: jest.fn(),
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ children }: any) => <>{children}</>,
  getI18n: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../TaskSidebarHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sidebar-header" />,
}));

jest.mock('../TaskSidebarName', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sidebar-name" />,
}));

jest.mock('../TaskSidebarParam', () => ({
  __esModule: true,
  default: ({ resourceParam }: { resourceParam: TektonParam }) => (
    <div data-testid={`task-sidebar-param-${resourceParam.name}`}>
      {resourceParam.name}
    </div>
  ),
}));

jest.mock('../TaskSidebarWhenExpression', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sidebar-when" />,
}));

jest.mock('../TaskSidebarWorkspace', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sidebar-workspace" />,
}));

jest.mock('../TaskSidebarResource', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sidebar-resource" />,
}));

jest.mock('@patternfly/react-component-groups', () => ({
  CloseButton: ({ onClick }: any) => (
    <button data-testid="close-button" onClick={onClick} />
  ),
}));

const requiredParam: TektonParam = {
  name: 'repo-url',
  type: 'string',
  description: 'The git repo URL',
};

const optionalParam: TektonParam = {
  name: 'verbose',
  type: 'string',
  description: 'Log verbosity',
  default: 'false',
};

const makeTaskResource = (params: TektonParam[]): TaskKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'Task',
    metadata: { name: 'example-task', namespace: 'default' },
    spec: {
      params,
      workspaces: [],
    },
  }) as unknown as TaskKind;

const makeSelectedData = (taskResource: TaskKind): SelectedBuilderTask =>
  ({
    isFinallyTask: false,
    taskIndex: 0,
    resource: taskResource,
  }) as SelectedBuilderTask;

describe('TaskSidebar', () => {
  const defaultProps = {
    errorMap: [],
    onRemoveTask: jest.fn(),
    onRenameTask: jest.fn(),
    resourceList: [],
    workspaceList: [],
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hideOptionalTaskParam', () => {
    it('should show all params when hideOptionalTaskParam is false', () => {
      const taskResource = makeTaskResource([requiredParam, optionalParam]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={false}
        />,
      );

      expect(screen.getByTestId('task-sidebar-param-repo-url')).toBeTruthy();
      expect(screen.getByTestId('task-sidebar-param-verbose')).toBeTruthy();
    });

    it('should hide optional params when hideOptionalTaskParam is true', () => {
      const taskResource = makeTaskResource([requiredParam, optionalParam]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={true}
        />,
      );

      expect(screen.getByTestId('task-sidebar-param-repo-url')).toBeTruthy();
      expect(screen.queryByTestId('task-sidebar-param-verbose')).toBeNull();
    });

    it('should show warning alert when all params are optional and toggle is on', () => {
      const taskResource = makeTaskResource([optionalParam]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={true}
        />,
      );

      expect(
        screen.getByText('There are no required params for this task'),
      ).toBeTruthy();
      expect(screen.queryByTestId('task-sidebar-param-verbose')).toBeNull();
    });

    it('should show all params including optional when toggle is off, even if all are optional', () => {
      const taskResource = makeTaskResource([optionalParam]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={false}
        />,
      );

      expect(screen.getByTestId('task-sidebar-param-verbose')).toBeTruthy();
      expect(
        screen.queryByText('There are no required params for this task'),
      ).toBeNull();
    });

    it('should show required params and no alert when toggle is on and required params exist', () => {
      const taskResource = makeTaskResource([requiredParam, optionalParam]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={true}
        />,
      );

      expect(screen.getByTestId('task-sidebar-param-repo-url')).toBeTruthy();
      expect(
        screen.queryByText('There are no required params for this task'),
      ).toBeNull();
    });

    it('should not render parameters section when task has no params', () => {
      const taskResource = makeTaskResource([]);
      render(
        <TaskSidebar
          {...defaultProps}
          selectedData={makeSelectedData(taskResource)}
          hideOptionalTaskParam={true}
        />,
      );

      expect(screen.queryByText('Parameters')).toBeNull();
    });
  });
});
