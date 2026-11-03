import { act } from '@testing-library/react';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { WORKLOAD_KUEUE_UID_LABEL } from '../../../consts';
import { testHook } from '../../../test-data/utils/hooks-utils';
import { PipelineRunKind, WorkloadKind } from '../../../types';
import { useDataViewFilter } from '../useDataViewFilter';
import { useDateRangeFilter } from '../useDateRangeFilter';
import { useDatasourcePreference } from '../useDatasourcePreference';
import { useWorkloads } from '../useMultiKueueResources';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
  useK8sWatchResource: jest.fn(() => [[], true, undefined]),
}));

jest.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('../useDateRangeFilter', () => ({
  NO_DATE_RANGE_FILTER: 0,
  parseDurationForDateRangeFiltering: jest.fn(),
  useDateRangeFilter: jest.fn(),
}));

jest.mock('../useDatasourcePreference', () => ({
  useDatasourcePreference: jest.fn(),
}));

jest.mock('../useMultiKueueResources', () => ({
  useWorkloads: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;
const useDateRangeFilterMock = useDateRangeFilter as jest.Mock;
const useDatasourcePreferenceMock = useDatasourcePreference as jest.Mock;
const useWorkloadsMock = useWorkloads as jest.Mock;

const makePipelineRun = (name: string, uid: string): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name, uid, namespace: 'test-ns' },
    spec: {},
  } as PipelineRunKind);

const makeWorkload = (uid: string, clusterName: string): WorkloadKind => ({
  metadata: { labels: { [WORKLOAD_KUEUE_UID_LABEL]: uid } },
  status: { clusterName },
});

const plrSpoke1 = makePipelineRun('plr-1', 'uid-1');
const plrSpoke2 = makePipelineRun('plr-2', 'uid-2');
const workloads = [
  makeWorkload('uid-1', 'spoke-1'),
  makeWorkload('uid-2', 'spoke-2'),
];

describe('useDataViewFilter cluster filter', () => {
  beforeEach(() => {
    useFlagMock.mockReturnValue(false);
    useDateRangeFilterMock.mockReturnValue({
      startDate: undefined,
      timespan: 0,
      setTimespanDateFilter: jest.fn(),
      dateFilterCEL: '',
      preferenceLoaded: true,
    });
    useDatasourcePreferenceMock.mockReturnValue({
      preference: ['cluster-data'],
      setPreference: jest.fn(),
      clearPreference: jest.fn(),
      loaded: true,
    });
    useWorkloadsMock.mockReturnValue([workloads, true, null]);
  });

  it('should watch workloads for PipelineRuns, using "-" when namespace is missing', () => {
    testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1],
        options: { resourceType: 'PipelineRun' },
      }),
    );

    expect(useWorkloadsMock).toHaveBeenCalledWith('-');
  });

  it('should watch workloads in the given namespace for PipelineRuns', () => {
    testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1],
        options: { resourceType: 'PipelineRun', namespace: 'test-ns' },
      }),
    );

    expect(useWorkloadsMock).toHaveBeenCalledWith('test-ns');
  });

  it('should not watch workloads for other resource types', () => {
    testHook(() =>
      useDataViewFilter({
        data: [],
        options: { resourceType: 'Pipeline', namespace: 'test-ns' },
      }),
    );

    expect(useWorkloadsMock).toHaveBeenCalledWith(undefined);
  });

  it('should filter PipelineRuns by the selected spoke cluster', () => {
    const { result } = testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1, plrSpoke2],
        options: { resourceType: 'PipelineRun', namespace: 'test-ns' },
      }),
    );

    act(() => {
      result.current.onSelectCluster('spoke-1');
    });

    expect(result.current.selectedCluster).toBe('spoke-1');
    expect(result.current.filteredData).toEqual([plrSpoke1]);
  });

  it('should not apply the cluster filter until workloads have loaded', () => {
    useWorkloadsMock.mockReturnValue([[], false, null]);

    const { result } = testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1, plrSpoke2],
        options: { resourceType: 'PipelineRun', namespace: 'test-ns' },
      }),
    );

    act(() => {
      result.current.onSelectCluster('spoke-1');
    });

    expect(result.current.filteredData).toEqual([plrSpoke1, plrSpoke2]);
  });

  it('should reset the cluster selection on clear all', () => {
    const { result } = testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1, plrSpoke2],
        options: { resourceType: 'PipelineRun', namespace: 'test-ns' },
      }),
    );

    act(() => {
      result.current.onSelectCluster('spoke-1');
    });
    act(() => {
      result.current.onClearAll();
    });

    expect(result.current.selectedCluster).toBe('');
    expect(result.current.filteredData).toEqual([plrSpoke1, plrSpoke2]);
  });

  it('should return workloads from the watch', () => {
    const { result } = testHook(() =>
      useDataViewFilter({
        data: [plrSpoke1],
        options: { resourceType: 'PipelineRun', namespace: 'test-ns' },
      }),
    );

    expect(result.current.workloads).toEqual(workloads);
  });
});
