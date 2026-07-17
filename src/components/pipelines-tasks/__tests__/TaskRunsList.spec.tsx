import { render, screen } from '@testing-library/react';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import TaskRunsList from '../TaskRunsList';
import { useTaskRuns } from '../../hooks/useTaskRuns';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import type { TaskRunKind } from '../../../types';
import type { DateRangeFilterResult } from '../../hooks/useDateRangeFilter';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
  ListPageBody: ({ children }) => <div>{children}</div>,
  ListPageCreateLink: ({ children }) => <div>{children}</div>,
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
  useK8sWatchResource: jest.fn(() => [[], true, undefined]),
  useActiveColumns: jest.fn(() => [[], jest.fn()]),
  ResourceLink: () => null,
  Timestamp: () => null,
}));
jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  ConsoleDataView: jest.fn(() => null),
  getNameCellProps: jest.fn(),
  actionsCellProps: {},
  cellIsStickyProps: {},
  LazyActionMenu: () => null,
}));
jest.mock('react-router', () => ({
  useParams: () => ({ ns: 'test-ns' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));
jest.mock('@patternfly/react-icons', () => ({
  ArchiveIcon: () => null,
}));
jest.mock('@patternfly/react-core', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
}));
jest.mock('../../hooks/useTaskRuns');
jest.mock('../../hooks/useDateRangeFilter');
jest.mock('../../hooks/useDataViewFilter', () => ({
  useDataViewFilter: ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useDateRangeFilter } = require('../../hooks/useDateRangeFilter');
    const { startDate, preferenceLoaded } = useDateRangeFilter('taskRun');
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
jest.mock('../TaskRunStatus', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../../utils/resource-link', () => ({
  ResourceLinkWithIcon: () => null,
}));
jest.mock('../../utils/pipeline-augment', () => ({
  getModelReferenceFromTaskKind: jest.fn(),
}));
jest.mock('../../utils/pipeline-utils', () => ({
  pipelineRunDuration: jest.fn(() => '-'),
}));
jest.mock('../../pipelines-details/pipeline-step-utils', () => ({
  sortPipelineAndTaskRunsByDuration: jest.fn(() => []),
}));
jest.mock('../../pipelines-overview/utils', () => ({
  getReferenceForModel: jest.fn(() => 'tekton.dev~v1~TaskRun'),
}));
jest.mock('../../utils/pipeline-filter-reducer', () => ({
  taskRunFilterReducer: jest.fn(() => 'Succeeded'),
  pipelineRunFilterReducer: jest.fn(() => 'Succeeded'),
}));

const useFlagMock = useFlag as jest.Mock;
const useTaskRunsMock = useTaskRuns as jest.Mock;
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

const makeTaskRun = (name: string, startTime?: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: { name, namespace: 'test-ns', uid: name },
    spec: {},
    status: startTime ? { startTime } : {},
  }) as unknown as TaskRunKind;

describe('TaskRunsList', () => {
  beforeEach(() => {
    useFlagMock.mockReturnValue(true);
    consoleDataViewMock.mockReturnValue(null);
    useDateRangeFilterMock.mockReturnValue(makeDateRange());
    useTaskRunsMock.mockReturnValue([[], true, true, undefined, false, false]);
  });

  it('should pass dateFilterCEL to useTaskRuns via dateRangeFilter option', () => {
    const cel =
      'data.status.startTime > timestamp("2026-07-10T00:00:00.000Z")';
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ dateFilterCEL: cel }),
    );
    render(<TaskRunsList />);
    expect(useTaskRunsMock).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      undefined,
      undefined,
      expect.objectContaining({ dateRangeFilter: cel }),
    );
  });

  it('should filter out old runs client-side', () => {
    const now = Date.now();
    const recent = makeTaskRun('recent', new Date(now - 1000).toISOString());
    const old = makeTaskRun(
      'old',
      new Date(now - 2 * ONE_DAY_MS).toISOString(),
    );
    useTaskRunsMock.mockReturnValue([
      [recent, old],
      true,
      true,
      undefined,
      false,
      false,
    ]);
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ timespan: ONE_DAY_MS, startDate: now - ONE_DAY_MS }),
    );
    render(<TaskRunsList />);
    const dataArg = consoleDataViewMock.mock.calls[0][0].data;
    expect(dataArg).not.toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ name: 'old' }),
      }),
    );
  });

  it('should keep runs without startTime (pending)', () => {
    const now = Date.now();
    const pending = makeTaskRun('pending');
    useTaskRunsMock.mockReturnValue([
      [pending],
      true,
      true,
      undefined,
      false,
      false,
    ]);
    useDateRangeFilterMock.mockReturnValue(
      makeDateRange({ timespan: ONE_DAY_MS, startDate: now - ONE_DAY_MS }),
    );
    render(<TaskRunsList />);
    const dataArg = consoleDataViewMock.mock.calls[0][0].data;
    expect(dataArg).toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ name: 'pending' }),
      }),
    );
  });

  it('should include time range as a singleSelect checkbox filter', () => {
    render(<TaskRunsList />);
    expect(screen.getByTestId('filter-timeRange')).toBeTruthy();
  });

  it('should hide filters when hideNameLabelFilters is true', () => {
    render(<TaskRunsList hideNameLabelFilters />);
    expect(screen.queryByTestId('filter-toolbar')).toBeNull();
  });
});
