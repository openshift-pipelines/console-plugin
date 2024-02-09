import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as redux from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import {
  VirtualizedTable,
  useK8sWatchResource,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import PipelinesOverviewPage from '../PipelinesOverviewPage';
import { getResultsSummary } from '../../utils/summary-api';
import * as utils from '../utils';
import * as namespaceHooks from '../../hooks/useActiveNamespace';

const virtualizedTableRenderProps = jest.fn();
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
  useActiveColumns: jest.fn(),
  VirtualizedTable: jest.fn(),
  k8sGet: jest.fn(),
}));
jest.mock('../../hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));
jest.mock('../../utils/tekton-results', () => ({
  createTektonResultsSummaryUrl: jest.fn(),
}));
jest.mock('../../utils/summary-api', () => ({
  getResultsSummary: jest.fn(),
}));
(VirtualizedTable as jest.Mock).mockImplementation((props) => {
  virtualizedTableRenderProps(props);
  return null;
});

jest.spyOn(utils, 'useQueryParams').mockReturnValue(null);
jest.spyOn(namespaceHooks, 'useActiveNamespace').mockReturnValue(['active']);
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.spyOn(redux, 'useDispatch').mockReturnValue(() => {});
const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));
jest.spyOn(namespaceHooks, 'useActiveNamespace').mockReturnValue(['active']);

const virtualizedTableMock = VirtualizedTable as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useActiveColumnsMock = useActiveColumns as jest.Mock;
const getResultsSummaryMock = getResultsSummary as jest.Mock;

describe('Pipeline Overview page', () => {
  beforeEach(() => {
    virtualizedTableMock.mockReturnValue(<></>);
    useK8sWatchResourceMock.mockReturnValue([[], true]);
    useActiveColumnsMock.mockReturnValue([[]]);
    getResultsSummaryMock.mockReturnValue(Promise.resolve({}));
  });

  it('should render Pipeline Overview', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getByText('Overview');
    });
  });

  it('should render PipelineRun status card', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getByText('PipelineRun status');
    });
  });

  it('should render Duration card', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getByText('Duration');
    });
  });

  it('should render Total runs card', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getAllByText('Total runs');
    });
  });

  it('should render Number of PipelineRuns card', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getByText('Number of PipelineRuns');
    });
  });

  it('should render List', async () => {
    render(<PipelinesOverviewPage />);
    await waitFor(() => {
      expect(screen).not.toBeNull();
      screen.getByText('Per Pipeline');
      screen.getByText('Per Repository');
    });
  });
});
