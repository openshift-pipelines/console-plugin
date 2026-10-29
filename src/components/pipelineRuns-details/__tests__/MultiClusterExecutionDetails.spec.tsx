import { render, screen } from '@testing-library/react';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import {
  ClusterQueueKind,
  MultiKueueClusterKind,
  PipelineRunKind,
  WorkloadKind,
} from '../../../types';
import {
  isClusterConnected,
  useGetClusterQueue,
  useGetMultiKueueCluster,
  useWorkloads,
} from '../../hooks/useMultiKueueResources';
import { calculateDuration } from '../../utils/pipeline-utils';
import MultiClusterExecutionDetails from '../MultiClusterExecutionDetails';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('../../hooks/useMultiKueueResources', () => ({
  isClusterConnected: jest.fn(),
  useGetClusterQueue: jest.fn(),
  useGetMultiKueueCluster: jest.fn(),
  useWorkloads: jest.fn(),
}));

jest.mock('../../utils/pipeline-utils', () => ({
  calculateDuration: jest.fn(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const useWorkloadsMock = useWorkloads as jest.Mock;
const useGetClusterQueueMock = useGetClusterQueue as jest.Mock;
const useGetMultiKueueClusterMock = useGetMultiKueueCluster as jest.Mock;
const isClusterConnectedMock = isClusterConnected as jest.Mock;
const calculateDurationMock = calculateDuration as jest.Mock;

const pipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: { name: 'plr', namespace: 'test-ns', uid: 'plr-uid' },
  spec: {},
};

const workload: WorkloadKind = {
  metadata: {
    name: 'workload',
    creationTimestamp: '2026-01-01T00:00:00Z',
  },
  spec: {
    queueName: 'local-queue',
  },
  status: {
    clusterName: 'spoke-1',
    admission: {
      clusterQueue: 'cluster-queue',
    },
    conditions: [
      {
        type: 'Admitted',
        status: 'True',
        lastTransitionTime: '2026-01-01T00:02:00Z',
      },
    ],
  },
};

const clusterQueue: ClusterQueueKind = {
  metadata: { name: 'cluster-queue' },
  spec: { queueingStrategy: 'StrictFIFO' },
  status: {
    pendingWorkloads: 3,
    admittedWorkloads: 5,
  },
};

const targetCluster: MultiKueueClusterKind = {
  metadata: { name: 'spoke-1' },
  status: {
    conditions: [{ type: 'Active', status: 'True' }],
  },
};

describe('MultiClusterExecutionDetails', () => {
  beforeEach(() => {
    useActiveNamespaceMock.mockReturnValue(['test-ns']);
    useWorkloadsMock.mockReturnValue([[workload], true, null]);
    useGetClusterQueueMock.mockReturnValue([clusterQueue, true, null]);
    useGetMultiKueueClusterMock.mockReturnValue([targetCluster, true, null]);
    isClusterConnectedMock.mockReturnValue(true);
    calculateDurationMock.mockReturnValue('2 minutes');
  });

  it('should render cluster execution, target cluster, and queue sections', () => {
    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('Cluster Execution')).toBeTruthy();
    expect(screen.getByText('Target Cluster Information')).toBeTruthy();
    expect(screen.getByText('Queue Information')).toBeTruthy();
    expect(useWorkloadsMock).toHaveBeenCalledWith('test-ns', pipelineRun);
    expect(useGetClusterQueueMock).toHaveBeenCalledWith('cluster-queue');
    expect(useGetMultiKueueClusterMock).toHaveBeenCalledWith('spoke-1');
  });

  it('should display target cluster name and connected status', () => {
    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('spoke-1')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(isClusterConnectedMock).toHaveBeenCalledWith(targetCluster);
  });

  it('should display disconnected status when the target cluster is not active', () => {
    isClusterConnectedMock.mockReturnValue(false);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('Disconnected')).toBeTruthy();
    expect(screen.queryByText('Connected')).toBeNull();
  });

  it('should display queue information from the workload and cluster queue', () => {
    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('cluster-queue')).toBeTruthy();
    expect(screen.getByText('local-queue')).toBeTruthy();
    expect(screen.getByText('2 minutes')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(calculateDurationMock).toHaveBeenCalledWith(
      '2026-01-01T00:00:00Z',
      '2026-01-01T00:02:00Z',
      true,
    );
  });

  it('should show a dash for queue wait when admitted time is missing', () => {
    useWorkloadsMock.mockReturnValue([
      [
        {
          ...workload,
          status: {
            ...workload.status,
            conditions: [],
          },
        },
      ],
      true,
      null,
    ]);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('-')).toBeTruthy();
    expect(calculateDurationMock).not.toHaveBeenCalled();
  });

  it('should show an error when target cluster information cannot be loaded', () => {
    useGetMultiKueueClusterMock.mockReturnValue([
      undefined,
      true,
      { message: 'not found' },
    ]);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(
      screen.getByText('Unable to load target cluster information'),
    ).toBeTruthy();
    expect(screen.queryByText('spoke-1')).toBeNull();
    expect(screen.getByText('cluster-queue')).toBeTruthy();
  });

  it('should show an error when queue information cannot be loaded', () => {
    useGetClusterQueueMock.mockReturnValue([
      undefined,
      true,
      { message: 'not found' },
    ]);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getByText('Unable to load queue information')).toBeTruthy();
    expect(screen.queryByText('cluster-queue')).toBeNull();
    expect(screen.getByText('spoke-1')).toBeTruthy();
  });

  it('should show errors for both sections when workloads fail to load', () => {
    useWorkloadsMock.mockReturnValue([[], true, { message: 'forbidden' }]);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(
      screen.getByText('Unable to load target cluster information'),
    ).toBeTruthy();
    expect(screen.getByText('Unable to load queue information')).toBeTruthy();
  });

  it('should show spinners while resources are loading', () => {
    useWorkloadsMock.mockReturnValue([[], false, null]);
    useGetClusterQueueMock.mockReturnValue([undefined, false, null]);
    useGetMultiKueueClusterMock.mockReturnValue([undefined, false, null]);

    render(<MultiClusterExecutionDetails pipelineRun={pipelineRun} />);

    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(screen.queryByText('spoke-1')).toBeNull();
    expect(screen.queryByText('cluster-queue')).toBeNull();
  });
});
