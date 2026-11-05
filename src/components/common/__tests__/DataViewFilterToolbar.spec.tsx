import { render, screen } from '@testing-library/react';
import { DataViewFilterToolbar } from '../DataViewFilterToolbar';

jest.mock('../MultiClusterFilterControl', () => ({
  MultiClusterFilterControl: ({ selected }: { selected: string }) => (
    <div data-testid="cluster-filter">{selected || 'all'}</div>
  ),
}));

const baseProps = {
  filterValues: { name: '', labels: [] },
  onFilterChange: jest.fn(),
  onClearAll: jest.fn(),
  clusterFilter: { selected: 'spoke-1', onSelect: jest.fn() },
};

describe('DataViewFilterToolbar cluster filter', () => {
  it('should render the cluster filter for PipelineRuns', () => {
    render(<DataViewFilterToolbar {...baseProps} resourceType="PipelineRun" />);

    expect(screen.getByTestId('cluster-filter').textContent).toBe('spoke-1');
  });

  it('should hide the cluster filter for other resource types', () => {
    render(<DataViewFilterToolbar {...baseProps} resourceType="TaskRun" />);

    expect(screen.queryByTestId('cluster-filter')).toBeNull();
  });

  it('should hide the cluster filter when clusterFilter is omitted', () => {
    render(
      <DataViewFilterToolbar
        filterValues={baseProps.filterValues}
        onFilterChange={baseProps.onFilterChange}
        onClearAll={baseProps.onClearAll}
        resourceType="PipelineRun"
      />,
    );

    expect(screen.queryByTestId('cluster-filter')).toBeNull();
  });
});
