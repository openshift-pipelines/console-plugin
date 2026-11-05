import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { WORKLOAD_KUEUE_UID_LABEL } from '../../../consts';
import {
  ClusterQueueModel,
  MultiKueueClusterModel,
  WorkloadModel,
} from '../../../models';
import { testHook } from '../../../test-data/utils/hooks-utils';
import {
  ClusterQueueKind,
  MultiKueueClusterKind,
  PipelineRunKind,
} from '../../../types';
import { useMultiClusterProxyService } from '../useMultiClusterProxyService';
import {
  isClusterConnected,
  useGetClusterQueue,
  useGetMultiKueueCluster,
  useWorkloads,
} from '../useMultiKueueResources';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
}));

jest.mock('../useMultiClusterProxyService', () => ({
  useMultiClusterProxyService: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const getGroupVersionKindForModelMock =
  getGroupVersionKindForModel as jest.Mock;
const useMultiClusterProxyServiceMock =
  useMultiClusterProxyService as jest.Mock;

const clusterQueueGVK = {
  group: ClusterQueueModel.apiGroup,
  version: ClusterQueueModel.apiVersion,
  kind: ClusterQueueModel.kind,
};

const multiKueueClusterGVK = {
  group: MultiKueueClusterModel.apiGroup,
  version: MultiKueueClusterModel.apiVersion,
  kind: MultiKueueClusterModel.kind,
};

describe('isClusterConnected', () => {
  it('should return true when the Active condition is True', () => {
    const cluster: MultiKueueClusterKind = {
      status: {
        conditions: [
          { type: 'Active', status: 'True' },
          { type: 'Ready', status: 'False' },
        ],
      },
    };

    expect(isClusterConnected(cluster)).toBe(true);
  });

  it('should return false when the Active condition is not True', () => {
    const cluster: MultiKueueClusterKind = {
      status: {
        conditions: [{ type: 'Active', status: 'False' }],
      },
    };

    expect(isClusterConnected(cluster)).toBe(false);
  });

  it('should return false when conditions are missing', () => {
    expect(isClusterConnected({} as MultiKueueClusterKind)).toBe(false);
    expect(
      isClusterConnected(undefined as unknown as MultiKueueClusterKind),
    ).toBe(false);
  });
});

describe('useGetMultiKueueCluster', () => {
  const cluster: MultiKueueClusterKind = { metadata: { name: 'spoke-1' } };

  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([cluster, true, null]);
  });

  it('should watch the named MultiKueueCluster', () => {
    const { result } = testHook(() => useGetMultiKueueCluster('spoke-1'));

    expect(getGroupVersionKindForModelMock).toHaveBeenCalledWith(
      MultiKueueClusterModel,
    );
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      groupVersionKind: multiKueueClusterGVK,
      name: 'spoke-1',
    });
    expect(result.current).toEqual([cluster, true, null]);
  });

  it('should skip the watch when cluster name is missing', () => {
    testHook(() => useGetMultiKueueCluster(undefined));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
    expect(getGroupVersionKindForModelMock).not.toHaveBeenCalled();
  });
});

describe('useGetClusterQueue', () => {
  const clusterQueue: ClusterQueueKind = {
    metadata: { name: 'cluster-queue' },
    spec: { queueingStrategy: 'StrictFIFO' },
  };

  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([clusterQueue, true, null]);
  });

  it('should watch the named ClusterQueue', () => {
    const { result } = testHook(() => useGetClusterQueue('cluster-queue'));

    expect(getGroupVersionKindForModelMock).toHaveBeenCalledWith(
      ClusterQueueModel,
    );
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      groupVersionKind: clusterQueueGVK,
      name: 'cluster-queue',
    });
    expect(result.current).toEqual([clusterQueue, true, null]);
  });

  it('should skip the watch when cluster queue name is missing', () => {
    testHook(() => useGetClusterQueue(undefined));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
    expect(getGroupVersionKindForModelMock).not.toHaveBeenCalled();
  });
});

describe('useWorkloads', () => {
  const pipelineRun: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name: 'plr', uid: 'plr-uid' },
    spec: {},
  };

  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([[], true, null]);
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: true });
  });

  it('should watch workloads labeled with the PipelineRun uid on a hub cluster', () => {
    testHook(() => useWorkloads('test-ns', pipelineRun));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      isList: true,
      groupVersionKind: {
        group: WorkloadModel.apiGroup,
        kind: WorkloadModel.kind,
        version: WorkloadModel.apiVersion,
      },
      namespace: 'test-ns',
      namespaced: true,
      selector: {
        matchLabels: {
          [WORKLOAD_KUEUE_UID_LABEL]: 'plr-uid',
        },
      },
    });
  });

  it('should omit namespace when watching all namespaces', () => {
    testHook(() => useWorkloads('-', pipelineRun));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespaced: true,
        selector: {
          matchLabels: {
            [WORKLOAD_KUEUE_UID_LABEL]: 'plr-uid',
          },
        },
      }),
    );
    expect(useK8sWatchResourceMock.mock.calls[0][0].namespace).toBeUndefined();
  });

  it('should watch all workloads when the PipelineRun has no uid', () => {
    testHook(() =>
      useWorkloads('test-ns', {
        ...pipelineRun,
        metadata: { name: 'plr' },
      }),
    );

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      isList: true,
      groupVersionKind: {
        group: WorkloadModel.apiGroup,
        kind: WorkloadModel.kind,
        version: WorkloadModel.apiVersion,
      },
      namespace: 'test-ns',
      namespaced: true,
    });
  });

  it('should skip the watch on a non-hub cluster', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: false });

    testHook(() => useWorkloads('test-ns', pipelineRun));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });

  it('should skip the watch when namespace is missing', () => {
    testHook(() => useWorkloads(undefined));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });

  it('should watch all workloads in a namespace when no PipelineRun is given', () => {
    testHook(() => useWorkloads('test-ns'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      isList: true,
      groupVersionKind: {
        group: WorkloadModel.apiGroup,
        kind: WorkloadModel.kind,
        version: WorkloadModel.apiVersion,
      },
      namespace: 'test-ns',
      namespaced: true,
    });
  });
});
