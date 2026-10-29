import { render, screen } from '@testing-library/react';
import { PipelineRunKind } from '../../../types';
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';
import PipelineRunDetails from '../PipelineRunDetails';

jest.mock('../../hooks/useMultiClusterProxyService', () => ({
  useMultiClusterProxyService: jest.fn(),
}));

jest.mock('../MultiClusterExecutionDetails', () => () => (
  <div data-testid="multi-cluster-execution-details" />
));

jest.mock('../PipelineRunVisualization', () => () => (
  <div data-testid="pipeline-run-visualization" />
));

jest.mock('../PipelineRunCustomDetails', () => () => (
  <div data-testid="pipeline-run-custom-details" />
));

jest.mock('../../details-page/details-page', () => ({
  ResourceSummary: () => <div data-testid="resource-summary" />,
}));

jest.mock('../../Loading', () => ({
  Loading: () => <div data-testid="loading" />,
}));

const useMultiClusterProxyServiceMock =
  useMultiClusterProxyService as jest.Mock;

const pipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: { name: 'plr', namespace: 'test-ns', uid: 'plr-uid' },
  spec: { managedBy: 'kueue.x-k8s.io/multikueue' },
};

describe('PipelineRunDetails', () => {
  beforeEach(() => {
    useMultiClusterProxyServiceMock.mockReturnValue({
      isHub: false,
      isResourceManagedByKueue: false,
    });
  });

  it('should show loading when the PipelineRun is missing', () => {
    render(<PipelineRunDetails obj={undefined} />);

    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('should render cluster execution details on a hub cluster for Kueue-managed PipelineRuns', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({
      isHub: true,
      isResourceManagedByKueue: true,
    });

    render(<PipelineRunDetails obj={pipelineRun} />);

    expect(screen.getByText('PipelineRun details')).toBeTruthy();
    expect(screen.getByTestId('multi-cluster-execution-details')).toBeTruthy();
    expect(useMultiClusterProxyServiceMock).toHaveBeenCalledWith({
      managedBy: 'kueue.x-k8s.io/multikueue',
    });
  });

  it('should hide cluster execution details when the cluster is not a hub', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({
      isHub: false,
      isResourceManagedByKueue: true,
    });

    render(<PipelineRunDetails obj={pipelineRun} />);

    expect(screen.queryByTestId('multi-cluster-execution-details')).toBeNull();
  });

  it('should hide cluster execution details when the PipelineRun is not managed by Kueue', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({
      isHub: true,
      isResourceManagedByKueue: false,
    });

    render(<PipelineRunDetails obj={pipelineRun} />);

    expect(screen.queryByTestId('multi-cluster-execution-details')).toBeNull();
  });
});
