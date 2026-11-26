import { fireEvent, render, screen } from '@testing-library/react';
import { SortByDirection } from '@patternfly/react-table';
import { useState } from 'react';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { LocalQueueKind } from '../../../types';
import { useDataViewFilter } from '../../hooks/useDataViewFilter';
import { useLocalQueues } from '../../hooks/useMultiKueueResources';
import LocalQueuesList from '../LocalQueuesList';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ListPageBody: ({ children }) => <div>{children}</div>,
  getGroupVersionKindForModel: jest.fn(),
  ResourceLink: ({ name, namespace }) => (
    <a href={`/k8s/ns/${namespace}/localqueues/${name}`}>{name}</a>
  ),
  Timestamp: ({ timestamp }) => <time>{timestamp}</time>,
}));

jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  ConsoleDataView: jest.fn(({ columns, data, getDataViewRows, loaded }) => {
    if (!loaded) return <div data-testid="loading-state" />;
    if (data.length === 0) return <div data-testid="empty-state" />;

    const rows = getDataViewRows(
      data.map((obj) => ({ obj })),
      columns,
    );

    return (
      <div data-testid="localqueues-table">
        {rows.flatMap((row, rowIndex) =>
          row.map(({ id, cell }, cellIndex) => (
            <div key={`${rowIndex}-${id}-${cellIndex}`}>{cell}</div>
          )),
        )}
      </div>
    );
  }),
  actionsCellProps: {},
  getNameCellProps: jest.fn(() => ({})),
  LazyActionMenu: () => null,
}));

jest.mock('react-router', () => ({
  useParams: () => ({ ns: 'test-namespace' }),
}));

jest.mock('../../common/DataViewFilterToolbar', () => ({
  DataViewFilterToolbar: ({ filterValues, onFilterChange, children }) => (
    <>
      <input
        aria-label="Filter by name"
        value={filterValues.name}
        onChange={(event) => onFilterChange('name', event.target.value)}
      />
      {children}
    </>
  ),
}));

jest.mock('../../hooks/useDataViewFilter', () => ({
  useDataViewFilter: jest.fn(),
}));

jest.mock('../../hooks/useMultiKueueResources', () => ({
  useLocalQueues: jest.fn(),
}));

const useLocalQueuesMock = useLocalQueues as jest.Mock;
const useDataViewFilterMock = useDataViewFilter as jest.Mock;

const localQueues: LocalQueueKind[] = [
  {
    apiVersion: 'kueue.x-k8s.io/v1beta2',
    kind: 'LocalQueue',
    metadata: {
      name: 'gpu-local-queue',
      namespace: 'test-namespace',
      creationTimestamp: '2026-09-08T09:10:27Z',
      managedFields: [
        { time: '2026-09-08T09:10:27Z' },
        { time: '2026-09-08T09:39:25Z' },
      ],
    },
    spec: { clusterQueue: 'gpu-cluster-queue' },
    status: { admittedWorkloads: 2, pendingWorkloads: 1 },
  },
  {
    apiVersion: 'kueue.x-k8s.io/v1beta2',
    kind: 'LocalQueue',
    metadata: {
      name: 'cpu-local-queue',
      namespace: 'test-namespace',
      creationTimestamp: '2026-09-07T09:10:27Z',
    },
  },
];

describe('LocalQueuesList', () => {
  beforeEach(() => {
    useLocalQueuesMock.mockReturnValue([localQueues, true, undefined]);
    useDataViewFilterMock.mockImplementation(({ data, options }) => {
      const [name, setName] = useState('');
      const filteredData = data.filter((localQueue) =>
        options.getName(localQueue).toLowerCase().includes(name.toLowerCase()),
      );

      return {
        filterValues: { name, labels: [] },
        onFilterChange: (_key: string, value: string) => setName(value),
        onClearAll: jest.fn(),
        filteredData,
      };
    });
  });

  it('renders the expected LocalQueue row values', () => {
    render(<LocalQueuesList />);

    expect(screen.getByRole('link', { name: 'gpu-local-queue' })).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2026-09-08T09:39:25Z')).toBeTruthy();
  });

  it('filters LocalQueues by name', () => {
    render(<LocalQueuesList />);

    const search = screen.getByLabelText('Filter by name');
    fireEvent.change(search, { target: { value: 'gpu' } });
    expect(screen.getByText('gpu-local-queue')).toBeTruthy();
    expect(screen.queryByText('cpu-local-queue')).toBeNull();
  });

  it('renders loading and empty states', () => {
    useLocalQueuesMock.mockReturnValue([[], false, undefined]);
    const { rerender } = render(<LocalQueuesList />);

    expect(screen.getByTestId('loading-state')).toBeTruthy();

    useLocalQueuesMock.mockReturnValue([[], true, undefined]);
    rerender(<LocalQueuesList />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('sorts by the displayed last updated timestamp', () => {
    render(<LocalQueuesList />);

    const consoleDataViewMock = ConsoleDataView as jest.Mock;
    const [{ columns }] =
      consoleDataViewMock.mock.calls[consoleDataViewMock.mock.calls.length - 1];
    const lastUpdatedColumn = columns.find(
      (column) => column.id === 'last-updated',
    );
    if (typeof lastUpdatedColumn?.sort !== 'function') {
      throw new Error('Expected Last Updated to have a custom sort function');
    }

    const olderQueueWithRecentUpdate: LocalQueueKind = {
      ...localQueues[0],
      metadata: {
        ...localQueues[0].metadata,
        name: 'older-queue',
        creationTimestamp: '2026-09-01T09:10:27Z',
        managedFields: [{ time: '2026-09-10T09:39:25Z' }],
      },
    };
    const newerQueueWithoutUpdate: LocalQueueKind = {
      ...localQueues[1],
      metadata: {
        ...localQueues[1].metadata,
        name: 'newer-queue',
        creationTimestamp: '2026-09-08T09:10:27Z',
      },
    };
    const sortedQueues = lastUpdatedColumn.sort(
      [newerQueueWithoutUpdate, olderQueueWithRecentUpdate],
      SortByDirection.desc,
    );

    expect(sortedQueues.map((queue) => queue.metadata.name)).toEqual([
      'older-queue',
      'newer-queue',
    ]);
  });
});
