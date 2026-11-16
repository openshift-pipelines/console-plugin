import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ClusterQueueKind } from '../../../types';
import ClusterQueuesList from '../ClusterQueuesList';
import { useDataViewFilter } from '../../hooks/useDataViewFilter';
import { useClusterQueues } from '../../hooks/useMultiKueueResources';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ListPageBody: ({ children }) => <div>{children}</div>,
  getGroupVersionKindForModel: jest.fn(),
  ResourceLink: ({ name }) => (
    <a href={`/k8s/cluster/clusterqueues/${name}`}>{name}</a>
  ),
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
      <div data-testid="clusterqueues-table">
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
  useClusterQueues: jest.fn(),
}));

jest.mock('../../status/Status', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

jest.mock('../../utils/common-utils', () => ({
  t: (key: string, values?: Record<string, string | number>) =>
    key.replace(/{{(\w+)}}/g, (_placeholder, name) =>
      String(values?.[name] ?? ''),
    ),
}));

const useClusterQueuesMock = useClusterQueues as jest.Mock;
const useDataViewFilterMock = useDataViewFilter as jest.Mock;

const clusterQueues: ClusterQueueKind[] = [
  {
    apiVersion: 'kueue.x-k8s.io/v1beta2',
    kind: 'ClusterQueue',
    metadata: { name: 'gpu-cq' },
    spec: {
      cohortName: 'platform',
      queueingStrategy: 'StrictFIFO',
      resourceGroups: [
        {
          flavors: [
            {
              name: 'gpu-flavor',
              resources: [
                { name: 'cpu', nominalQuota: '8' },
                { name: 'memory', nominalQuota: '16Gi' },
              ],
            },
          ],
        },
      ],
    },
    status: {
      admittedWorkloads: 3,
      pendingWorkloads: 1,
      conditions: [{ type: 'Active', status: 'True' }],
    },
  },
  {
    apiVersion: 'kueue.x-k8s.io/v1beta2',
    kind: 'ClusterQueue',
    metadata: { name: 'cpu-cq' },
    spec: {
      cohortName: 'shared',
      queueingStrategy: 'BestEffortFIFO',
    },
  },
];

describe('ClusterQueuesList', () => {
  beforeEach(() => {
    useClusterQueuesMock.mockReturnValue([clusterQueues, true, undefined]);
    useDataViewFilterMock.mockImplementation(({ data, options }) => {
      const [name, setName] = useState('');
      const filteredData = data.filter((clusterQueue) =>
        options
          .getName(clusterQueue)
          .toLowerCase()
          .includes(name.toLowerCase()),
      );

      return {
        filterValues: { name, labels: [] },
        onFilterChange: (_key: string, value: string) => setName(value),
        onClearAll: jest.fn(),
        filteredData,
      };
    });
  });

  it('renders the expected ClusterQueue row values', () => {
    render(<ClusterQueuesList />);

    expect(screen.getByRole('link', { name: 'gpu-cq' })).toBeTruthy();
    expect(screen.getByText('platform')).toBeTruthy();
    expect(screen.getByText('StrictFIFO')).toBeTruthy();
    expect(screen.getByText('8 cores · 16Gi')).toBeTruthy();
    expect(screen.getByText('gpu-flavor')).toBeTruthy();
    expect(screen.getByText('3 admitted · 1 pending')).toBeTruthy();
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  it('filters ClusterQueues by name', () => {
    render(<ClusterQueuesList />);

    const search = screen.getByLabelText('Filter by name');
    fireEvent.change(search, { target: { value: 'gpu' } });
    expect(screen.getByText('gpu-cq')).toBeTruthy();
    expect(screen.queryByText('cpu-cq')).toBeNull();
  });

  it('renders loading and empty states', () => {
    useClusterQueuesMock.mockReturnValue([[], false, undefined]);
    const { rerender } = render(<ClusterQueuesList />);

    expect(screen.getByTestId('loading-state')).toBeTruthy();

    useClusterQueuesMock.mockReturnValue([[], true, undefined]);
    rerender(<ClusterQueuesList />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });
});
