import { render, screen } from '@testing-library/react';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import PipelineRunsList from '../PipelineRunsList';
import { useGetPipelineRuns } from '../../hooks/useTektonResult';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import type { PipelineRunKind } from '../../../types';
import type { DateRangeFilterResult } from '../../hooks/useDateRangeFilter';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
  ListPageBody: ({ children }) => <div>{children}</div>,
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
  useK8sWatchResource: jest.fn(() => [[], true, undefined]),
}));
jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  ConsoleDataView: jest.fn(() => null),
}));
jest.mock('react-router', () => ({
  useParams: () => ({ ns: 'test-ns' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));
jest.mock('../../hooks/useTektonResult');
jest.mock('../../hooks/useDateRangeFilter');
jest.mock('../../hooks/useDataViewFilter', () => ({
  useDataViewFilter: ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useDateRangeFilter } = require('../../hooks/useDateRangeFilter');
    const { startDate, preferenceLoaded } = useDateRangeFilter('pipelineRun');
    const filtered = startDate
      ? data.filter((obj) => {
          const st = obj.status?.startTime;
          if (!st) return true;
          return new Date(st).getTime() > startDate;
        })
      : data;
    return {
      filterValues: {},
      onFilterChange: jest.fn(),
      onClearAll: jest.fn(),
      filteredData: filtered,
      updatedCheckboxFilters: preferenceLoaded
        ? [{ id: 'timeRange', singleSelect: true, options: [] }]
        : [],
      preferenceLoaded: preferenceLoaded ?? true,
    };
  },
}));
jest.mock('../../common/DataViewFilterToolbar', () => ({
  DataViewFilterToolbar: ({ checkboxFilters }) => (
    <div data-testid="filter-toolbar">
      {checkboxFilters?.map((f) =>
        f.singleSelect ? (
          <span key={f.id} data-testid={`filter-${f.id}`} />
        ) : null,
      )}
    </div>
  ),
}));
jest.mock('../usePipelineRunsColumns', () => ({
  __esModule: true,
  default: () => [],
}));
jest.mock('../../hooks/hooks', () => ({
  useGetActiveUser: () => 'test-user',
}));

const useFlagMock = useFlag as jest.Mock;
const useGetPipelineRunsMock = useGetPipelineRuns as jest.Mock;
const useDateRangeFilterMock = useDateRangeFilter as jest.Mock;
const consoleDataViewMock = ConsoleDataView as jest.Mock;

const ONE_DAY_MS = 86400000;

const makeDateRange = (
  overrides?: Partial<DateRangeFilterResult>,
): DateRangeFilterResult => ({
  timespan: 0,
  setTimespanDateFilter: jest.fn(),
  startDate: undefined,
  dateFilterCEL: '',
  preferenceLoaded: true,
  ...overrides,
});

const makePipelineRun = (name: string, startTime?: string): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name, namespace: 'test-ns', uid: name },
    status: startTime ? { startTime } : {},
  } as unknown as PipelineRunKind);

describe('PipelineRunsList', () => {
  beforeEach(() => {
    useFlagMock.mockReturnValue(true);
    consoleDataViewMock.mockReturnValue(null);
    useDateRangeFilterMock.mockReturnValue(makeDateRange());
    useGetPipelineRunsMock.mockReturnValue([[], true, true, undefined]);
  });

  it('should pass dateFilterCEL to useGetPipelineRuns', () => {
    const cel =
      'data.status.startTime > timestamp("2026-06-14T00:00:00.000Z")';
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ dateFilterCEL: cel }),
    );
    render(<PipelineRunsList namespace="test-ns" />);
    expect(useGetPipelineRunsMock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({ dateRangeFilter: cel }),
    );
  });

  it('should filter out old runs client-side', () => {
    const now = Date.now();
    const recent = makePipelineRun(
      'recent',
      new Date(now - 1000).toISOString(),
    );
    const old = makePipelineRun(
      'old',
      new Date(now - 2 * ONE_DAY_MS).toISOString(),
    );
    useGetPipelineRunsMock.mockReturnValue([
      [recent, old],
      true,
      true,
      undefined,
    ]);
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ timespan: ONE_DAY_MS, startDate: now - ONE_DAY_MS }),
    );
    render(<PipelineRunsList namespace="test-ns" />);
    const dataArg = consoleDataViewMock.mock.calls[0][0].data;
    expect(dataArg).not.toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ name: 'old' }),
      }),
    );
  });

  it('should keep runs without startTime (pending)', () => {
    const now = Date.now();
    const pending = makePipelineRun('pending');
    useGetPipelineRunsMock.mockReturnValue([[pending], true, true, undefined]);
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ timespan: ONE_DAY_MS, startDate: now - ONE_DAY_MS }),
    );
    render(<PipelineRunsList namespace="test-ns" />);
    const dataArg = consoleDataViewMock.mock.calls[0][0].data;
    expect(dataArg).toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ name: 'pending' }),
      }),
    );
  });

  it('should include time range as a singleSelect checkbox filter', () => {
    render(<PipelineRunsList namespace="test-ns" />);
    expect(screen.getByTestId('filter-timeRange')).toBeTruthy();
  });

  it('should hide filters when hideTextFilter is true', () => {
    render(<PipelineRunsList namespace="test-ns" hideTextFilter />);
    expect(screen.queryByTestId('filter-toolbar')).toBeNull();
  });
});
