import { SortByDirection } from '@patternfly/react-table';
import { WORKLOAD_KUEUE_UID_LABEL } from '../../../consts';
import { testHook } from '../../../test-data/utils/hooks-utils';
import { PipelineRunKind, WorkloadKind } from '../../../types';
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';
import { getClusterNameForPipelineRun } from '../PipelineRunsRow';
import usePipelineRunsColumns from '../usePipelineRunsColumns';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: () => null,
  Timestamp: () => null,
  getGroupVersionKindForModel: jest.fn(),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  actionsCellProps: {},
  getNameCellProps: jest.fn(),
  LazyActionMenu: () => null,
}));

jest.mock('../../hooks/useMultiClusterProxyService', () => ({
  useMultiClusterProxyService: jest.fn(),
}));

const useMultiClusterProxyServiceMock =
  useMultiClusterProxyService as jest.Mock;

const makePipelineRun = (name: string, uid: string): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name, uid, namespace: 'test-ns' },
    spec: {},
  } as PipelineRunKind);

const makeWorkload = (uid: string, clusterName?: string): WorkloadKind => ({
  metadata: { labels: { [WORKLOAD_KUEUE_UID_LABEL]: uid } },
  status: clusterName ? { clusterName } : {},
});

describe('getClusterNameForPipelineRun', () => {
  it('should return the spoke cluster from the matching workload', () => {
    const plr = makePipelineRun('plr', 'uid-1');
    const workloads = [makeWorkload('uid-1', 'spoke-1')];

    expect(getClusterNameForPipelineRun(plr, workloads)).toBe('spoke-1');
  });

  it('should return "-" when no workload matches', () => {
    const plr = makePipelineRun('plr', 'uid-1');

    expect(getClusterNameForPipelineRun(plr, [])).toBe('-');
  });

  it('should return "-" when the workload has no cluster name', () => {
    const plr = makePipelineRun('plr', 'uid-1');

    expect(getClusterNameForPipelineRun(plr, [makeWorkload('uid-1')])).toBe(
      '-',
    );
  });
});

describe('usePipelineRunsColumns', () => {
  beforeEach(() => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: false });
  });

  it('should omit the Cluster column on a non-hub cluster', () => {
    const { result } = testHook(() =>
      usePipelineRunsColumns('test-ns', false, []),
    );

    expect(
      result.current.find((c) => c.id === 'spoke-cluster'),
    ).toBeUndefined();
  });

  it('should include a Cluster column on a hub cluster', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: true });

    const { result } = testHook(() =>
      usePipelineRunsColumns('test-ns', false, []),
    );

    const clusterColumn = result.current.find((c) => c.id === 'spoke-cluster');
    expect(clusterColumn?.title).toBe('Cluster');
  });

  it('should sort PipelineRuns by spoke cluster name', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: true });
    const plrA = makePipelineRun('plr-a', 'uid-a');
    const plrB = makePipelineRun('plr-b', 'uid-b');
    const workloads = [
      makeWorkload('uid-a', 'zeta'),
      makeWorkload('uid-b', 'alpha'),
    ];

    const { result } = testHook(() =>
      usePipelineRunsColumns('test-ns', false, workloads),
    );
    const clusterColumn = result.current.find((c) => c.id === 'spoke-cluster');
    const sort = clusterColumn?.sort as (
      data: PipelineRunKind[],
      direction: SortByDirection,
    ) => PipelineRunKind[];

    expect(
      sort([plrA, plrB], SortByDirection.asc).map((p) => p.metadata.name),
    ).toEqual(['plr-b', 'plr-a']);
    expect(
      sort([plrA, plrB], SortByDirection.desc).map((p) => p.metadata.name),
    ).toEqual(['plr-a', 'plr-b']);
  });
});
