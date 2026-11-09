import { render, screen } from '@testing-library/react';
import { ClusterQueueKind } from '../../../types';
import { getClusterQueueDataViewRows } from '../ClusterQueueRow';
import { clusterQueueColumnIds } from '../useClusterQueuesColumns';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: ({ name }: { name: string }) => name,
  getGroupVersionKindForModel: jest.fn(),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  actionsCellProps: {},
  getNameCellProps: jest.fn(() => ({})),
  LazyActionMenu: () => null,
}));

jest.mock('../../status/Status', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => status,
}));

jest.mock('../../utils/common-utils', () => ({
  t: (key: string, values?: Record<string, string | number>) =>
    key.replace(/{{(\w+)}}/g, (_placeholder, name) =>
      String(values?.[name] ?? ''),
    ),
}));

const clusterQueue: ClusterQueueKind = {
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
};

describe('ClusterQueue list data', () => {
  it('renders the displayed values for a ClusterQueue row', () => {
    const columns = Object.values(clusterQueueColumnIds).map((id) => ({ id }));
    const [row] = getClusterQueueDataViewRows(
      [{ obj: clusterQueue }] as any,
      columns as any,
    );

    render(
      <>
        {row.map(({ id, cell }) => (
          <div key={id}>{cell}</div>
        ))}
      </>,
    );

    expect(screen.getByText('gpu-cq')).toBeDefined();
    expect(screen.getByText('platform')).toBeDefined();
    expect(screen.getByText('StrictFIFO')).toBeDefined();
    expect(screen.getByText('8 cores · 16Gi')).toBeDefined();
    expect(screen.getByText('gpu-flavor')).toBeDefined();
    expect(screen.getByText('3 admitted · 1 pending')).toBeDefined();
    expect(screen.getByText('Ready')).toBeDefined();
  });
});
