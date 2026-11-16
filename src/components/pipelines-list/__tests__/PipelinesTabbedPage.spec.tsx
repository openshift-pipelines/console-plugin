import { render, screen } from '@testing-library/react';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { PageContents } from '../PipelinesTabbedPage';
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
}));

jest.mock('../../hooks/use-k8sGet-hook', () => ({
  useK8sGet: jest.fn(() => [undefined, false, undefined]),
}));

jest.mock('../../hooks/useMultiClusterProxyService', () => ({
  useMultiClusterProxyService: jest.fn(),
}));

jest.mock('../../approval-tasks', () => ({
  ApprovalTasksList: () => null,
}));

jest.mock('../../clusterqueues/ClusterQueuesList', () => () => null);

jest.mock('../../pipelineRuns-list', () => ({
  PipelineRunsList: () => null,
}));

jest.mock('../../pipelines-list', () => ({
  PipelinesList: () => null,
}));

jest.mock('../../projects-list/AllProjectsPage', () => () => null);

jest.mock('../../repositories-list', () => ({
  RepositoriesList: () => null,
}));

jest.mock('../../multi-tab-list', () => ({
  MultiTabListPage: ({ pages, menuActions }) => (
    <nav>
      {pages.map((page) => (
        <span key={page.href} data-testid={`tab-${page.href || 'pipelines'}`}>
          {page.name}
        </span>
      ))}
      {Object.keys(menuActions).map((action) => (
        <span key={action} data-testid={`create-${action}`} />
      ))}
    </nav>
  ),
}));

const useFlagMock = useFlag as jest.Mock;
const useMultiClusterProxyServiceMock =
  useMultiClusterProxyService as jest.Mock;

describe('PipelinesTabbedPage', () => {
  beforeEach(() => {
    useFlagMock.mockReturnValue(false);
  });

  it('shows the ClusterQueues tab on a hub cluster', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: true });

    render(<PageContents namespace="test" perspective="admin" />);

    expect(screen.getByTestId('tab-clusterqueues')).toBeTruthy();
    expect(screen.getByTestId('create-clusterQueue')).toBeTruthy();
  });

  it('hides the ClusterQueues tab on a non-hub cluster', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: false });

    render(<PageContents namespace="test" perspective="admin" />);

    expect(screen.queryByTestId('tab-clusterqueues')).toBeNull();
    expect(screen.queryByTestId('create-clusterQueue')).toBeNull();
  });
});
