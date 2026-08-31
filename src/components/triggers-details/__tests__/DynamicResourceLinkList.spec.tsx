import type { ReactElement } from 'react';
import { configure, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import DynamicResourceLinkList from '../DynamicResourceLinkList';
import { PipelineModel, TaskModel } from '../../../models';

configure({ testIdAttribute: 'data-test' });

const mockResourceLinkWithIcon: jest.Mock = jest.fn(() => (
  <div data-test="resource-link-with-icon" />
));
const mockPipelineResourceRef: jest.Mock = jest.fn(() => (
  <div data-test="pipeline-resource-ref" />
));

jest.mock('../../utils/resource-link', () => ({
  ResourceLinkWithIcon: (props: unknown) => mockResourceLinkWithIcon(props),
}));

jest.mock('../PipelineResourceRef', () => ({
  __esModule: true,
  default: (props: unknown) => mockPipelineResourceRef(props),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
}));

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DynamicResourceLinkList', () => {
  it('should not render when there are no links', () => {
    const { container } = renderWithRouter(
      <DynamicResourceLinkList links={[]} namespace="test-ns" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render PipelineResourceRef by default', () => {
    renderWithRouter(
      <DynamicResourceLinkList
        namespace="test-ns"
        links={[
          {
            resourceKind: 'Task',
            name: 'example-task',
            qualifier: 'my-task',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('pipeline-resource-ref')).toBeTruthy();
    expect(screen.queryByTestId('resource-link-with-icon')).toBeNull();
    expect(mockPipelineResourceRef).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceKind: 'Task',
        resourceName: 'example-task',
        displayName: 'my-task (example-task)',
        namespace: 'test-ns',
        disableLink: false,
        resourceApiVersion: '',
      }),
    );
  });

  it('should render ResourceLinkWithIcon when openInNewTab is true', () => {
    renderWithRouter(
      <DynamicResourceLinkList
        namespace="test-ns"
        openInNewTab
        links={[
          {
            resourceKind: 'Pipeline',
            name: 'nested-pipeline',
            qualifier: 'pipeline-task',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('resource-link-with-icon')).toBeTruthy();
    expect(screen.queryByTestId('pipeline-resource-ref')).toBeNull();
    expect(mockResourceLinkWithIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        model: PipelineModel,
        name: 'nested-pipeline',
        displayName: 'pipeline-task (nested-pipeline)',
        namespace: 'test-ns',
        openInNewTab: true,
        linkTo: true,
        groupVersionKind: {
          group: PipelineModel.apiGroup,
          version: PipelineModel.apiVersion,
          kind: PipelineModel.kind,
        },
      }),
    );
  });

  it('should disable links when disableLink is true and openInNewTab is true', () => {
    renderWithRouter(
      <DynamicResourceLinkList
        namespace="test-ns"
        openInNewTab
        links={[
          {
            resourceKind: 'Task',
            name: 'custom-task',
            qualifier: 'approval-task',
            disableLink: true,
          },
        ]}
      />,
    );

    expect(mockResourceLinkWithIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        model: TaskModel,
        linkTo: false,
      }),
    );
  });

  it('should use the task namespace override when provided', () => {
    renderWithRouter(
      <DynamicResourceLinkList
        namespace="parent-ns"
        openInNewTab
        links={[
          {
            resourceKind: 'Task',
            name: 'cluster-task',
            qualifier: 'cluster-task-ref',
            namespace: 'task-ns',
          },
        ]}
      />,
    );

    expect(mockResourceLinkWithIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'task-ns',
      }),
    );
  });
});
