import type { ReactElement } from 'react';
import { configure, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ResourceSidebarHeader from '../ResourceSidebarHeader';
import { PipelineModel, TaskModel } from '../../../../models';

configure({ testIdAttribute: 'data-test' });

const mockResourceLinkWithIcon: jest.Mock = jest.fn(() => (
  <div data-test="resource-link-with-icon" />
));

jest.mock('../../../utils/resource-link', () => ({
  ResourceLinkWithIcon: (props: unknown) => mockResourceLinkWithIcon(props),
}));

jest.mock('../ResourceSidebarShortcuts', () => ({
  __esModule: true,
  default: () => <div data-test="resource-sidebar-shortcuts" />,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  getGroupVersionKindForResource: jest.fn((resource) => ({
    group: resource.apiVersion?.split('/')[0],
    version: resource.apiVersion,
    kind: resource.kind,
  })),
}));

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const pipelineResource = {
  apiVersion: 'tekton.dev/v1',
  kind: 'Pipeline',
  metadata: {
    name: 'example-pipeline',
    namespace: 'test-ns',
  },
};

const taskResource = {
  apiVersion: 'tekton.dev/v1',
  kind: 'Task',
  metadata: {
    name: 'example-task',
    namespace: 'test-ns',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ResourceSidebarHeader', () => {
  it('should link to pipeline details when viewing a pipeline', () => {
    renderWithRouter(
      <ResourceSidebarHeader
        resource={pipelineResource}
        removeThisTask={jest.fn()}
        isPipeline
      />,
    );

    expect(mockResourceLinkWithIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        model: PipelineModel,
        name: 'example-pipeline',
        namespace: 'test-ns',
        openInNewTab: true,
        linkTo: true,
      }),
    );
  });

  it('should not link when viewing a task', () => {
    renderWithRouter(
      <ResourceSidebarHeader
        resource={taskResource}
        removeThisTask={jest.fn()}
        isPipeline={false}
      />,
    );

    expect(mockResourceLinkWithIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        model: TaskModel,
        name: 'example-task',
        namespace: 'test-ns',
        openInNewTab: true,
        linkTo: false,
      }),
    );
    expect(screen.getByTestId('resource-link-with-icon')).toBeTruthy();
  });
});
