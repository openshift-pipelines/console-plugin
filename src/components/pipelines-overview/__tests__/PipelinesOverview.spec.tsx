import { render, screen, waitFor } from '@testing-library/react';
import {
  useK8sWatchResource,
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import PipelinesOverviewPage from '../PipelinesOverviewPage';
import { getResultsSummary } from '../../utils/summary-api';
import * as utils from '../utils';

const setActiveNamespace = jest.fn();
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  getGroupVersionKindForModel: jest.fn((model) => ({
    group: model?.apiGroup,
    version: model?.apiVersion,
    kind: model?.kind,
  })),
  useK8sWatchResource: jest.fn(),
  useActiveNamespace: jest.fn(),
  k8sGet: jest.fn(),
  useFlag: jest.fn(),
}));
jest.mock('@openshift-console/dynamic-plugin-sdk-internal', () => ({
  ConsoleDataView: jest.fn(),
}));
jest.mock('../../utils/tekton-results', () => ({
  createTektonResultsSummaryUrl: jest.fn(),
}));
jest.mock('../../utils/summary-api', () => ({
  getResultsSummary: jest.fn(),
}));
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock('react-router', () => ({
  useLocation: jest.fn(),
}));

jest.spyOn(utils, 'useQueryParams').mockReturnValue(null);

const consoleDataViewMock = ConsoleDataView as jest.Mock;
const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const getResultsSummaryMock = getResultsSummary as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useDispatchMock = useDispatch as unknown as jest.Mock;
const useSelectorMock = useSelector as unknown as jest.Mock;
const useLocationMock = useLocation as jest.Mock;

describe('Pipeline Overview page', () => {
  beforeEach(() => {
    consoleDataViewMock.mockReturnValue(<></>);
    useActiveNamespaceMock.mockReturnValue([
      'active-namespace',
      setActiveNamespace,
    ]);
    useK8sWatchResourceMock.mockReturnValue([[], true]);
    getResultsSummaryMock.mockReturnValue(Promise.resolve({}));
    useFlagMock.mockReturnValue(true);
    useDispatchMock.mockReturnValue(jest.fn());
    useSelectorMock.mockReturnValue(null);
    useLocationMock.mockReturnValue({ search: '', pathname: '/' });
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
