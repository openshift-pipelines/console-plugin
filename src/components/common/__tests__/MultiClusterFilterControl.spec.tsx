import { fireEvent, render, screen } from '@testing-library/react';
import { MultiKueueClusterKind } from '../../../types';
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';
import {
  isClusterConnected,
  useMultiKueueClusters,
} from '../../hooks/useMultiKueueResources';
import { MultiClusterFilterControl } from '../MultiClusterFilterControl';

jest.mock('../../hooks/useMultiClusterProxyService', () => ({
  useMultiClusterProxyService: jest.fn(),
}));

jest.mock('../../hooks/useMultiKueueResources', () => ({
  isClusterConnected: jest.fn(),
  useMultiKueueClusters: jest.fn(),
}));

const useMultiClusterProxyServiceMock =
  useMultiClusterProxyService as jest.Mock;
const useMultiKueueClustersMock = useMultiKueueClusters as jest.Mock;
const isClusterConnectedMock = isClusterConnected as jest.Mock;

const spoke1: MultiKueueClusterKind = { metadata: { name: 'spoke-1' } };
const spoke2: MultiKueueClusterKind = { metadata: { name: 'spoke-2' } };

describe('MultiClusterFilterControl', () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: true });
    useMultiKueueClustersMock.mockReturnValue([[spoke1, spoke2], true, null]);
    isClusterConnectedMock.mockImplementation(
      (cluster: MultiKueueClusterKind) => cluster.metadata?.name === 'spoke-1',
    );
  });

  it('should render nothing on a non-hub cluster', () => {
    useMultiClusterProxyServiceMock.mockReturnValue({ isHub: false });

    const { container } = render(
      <MultiClusterFilterControl selected="" onSelect={onSelect} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show an error alert when clusters fail to load', () => {
    useMultiKueueClustersMock.mockReturnValue([undefined, false, new Error()]);

    render(<MultiClusterFilterControl selected="" onSelect={onSelect} />);

    expect(
      screen.getByText('Unable to load target cluster information'),
    ).toBeTruthy();
  });

  it('should show a loading spinner while clusters are loading', () => {
    useMultiKueueClustersMock.mockReturnValue([undefined, false, null]);

    render(<MultiClusterFilterControl selected="" onSelect={onSelect} />);

    expect(screen.getByLabelText('Loading clusters')).toBeTruthy();
  });

  it('should disable the toggle when no clusters are available', () => {
    useMultiKueueClustersMock.mockReturnValue([[], true, null]);

    render(<MultiClusterFilterControl selected="" onSelect={onSelect} />);

    expect(
      (
        screen.getByRole('button', {
          name: 'All Clusters',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('should list cluster names and the status legend', () => {
    render(<MultiClusterFilterControl selected="" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'All Clusters' }));

    expect(screen.getByText('spoke-1')).toBeTruthy();
    expect(screen.getByText('spoke-2')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });

  it('should call onSelect with the cluster name', () => {
    render(<MultiClusterFilterControl selected="" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'All Clusters' }));
    fireEvent.click(screen.getByText('spoke-1'));

    expect(onSelect).toHaveBeenCalledWith('spoke-1');
  });

  it('should show a clear button that resets the selection', () => {
    render(
      <MultiClusterFilterControl selected="spoke-1" onSelect={onSelect} />,
    );

    expect(screen.getByRole('button', { name: /spoke-1/ })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Clear cluster filter'));

    expect(onSelect).toHaveBeenCalledWith('');
  });
});
