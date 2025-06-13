import * as React from 'react';
import { render, screen } from '@testing-library/react';
import PacPage from '../PacPage';
import {
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { usePacData } from '../hooks/usePacData';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import { sampleSecretData } from '../../../test-data/pac-data';

// Mocks
jest.mock('../hooks/usePacData');
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  useAccessReview: jest.fn(),
  useFlag: jest.fn(),
}));
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: () => ({ ns: 'openshift-pipelines' }),
  useLocation: () => ({
    pathname: '/pac/ns/openshift-pipelines',
    search: '',
    hash: '',
    state: null,
  }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../PacForm', () => () => <div data-testid="PacForm" />);
jest.mock('../PacOverview', () => (props: any) => (
  <div data-testid="PacOverview" data-secret={JSON.stringify(props.secret)} />
));
jest.mock('../../status/status-box', () => ({
  LoadingBox: () => <div data-testid="LoadingBox" />,
}));
jest.mock('../../common/error', () => ({
  ErrorPage404: () => <div data-testid="ErrorPage404" />,
  AccessDenied: () => <div data-testid="AccessDenied" />,
}));

describe('PacPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useAccessReview as jest.Mock).mockReturnValue([true, false]);
    (useFlag as jest.Mock).mockReturnValue(true);
  });

  const renderComponent = () => render(<PacPage />, { wrapper: MemoryRouter });

  it('should show 404, if pipeline operator is not installed', () => {
    (useFlag as jest.Mock).mockReturnValue(false);
    (usePacData as jest.Mock).mockReturnValue({
      loaded: false,
      secretData: undefined,
      loadError: null,
      isFirstSetup: false,
    });
    renderComponent();
    expect(screen.getByTestId('ErrorPage404')).toBeDefined();
  });

  it('should return access denied, if user does not have access to create resources in openshift-pipelines', () => {
    (useAccessReview as jest.Mock).mockReturnValue([false, false]);
    (useFlag as jest.Mock).mockReturnValue(true);

    (usePacData as jest.Mock).mockReturnValue({
      loaded: false,
      secretData: undefined,
      loadError: null,
      isFirstSetup: false,
    });
    renderComponent();
    expect(screen.getByTestId('AccessDenied')).toBeDefined();
  });

  it('should show loading if resources are still being fetched', () => {
    (usePacData as jest.Mock).mockReturnValue({
      loaded: false,
      secretData: undefined,
      loadError: null,
    });

    renderComponent();
    expect(screen.getByTestId('LoadingBox')).toBeDefined();
  });

  it('should show pac form if no secret exists in openshift-pipelines ns', () => {
    (usePacData as jest.Mock).mockReturnValue({
      loaded: true,
      secretData: undefined,
      loadError: null,
    });

    renderComponent();
    expect(screen.getByTestId('PacForm')).toBeDefined();
  });

  it('should show pac overview if secret exists in openshift-pipelines ns', () => {
    (usePacData as jest.Mock).mockReturnValue({
      loaded: true,
      secretData: sampleSecretData,
      loadError: null,
    });

    renderComponent();
    expect(screen.getByTestId('PacOverview')).toBeDefined();
  });

  it('should show pac overview in case of any error with retrieving code or creating secret', () => {
    const errorMsg = new Error('Something went wrong');
    (usePacData as jest.Mock).mockReturnValue({
      loaded: true,
      secretData: undefined,
      loadError: errorMsg,
    });

    renderComponent();
    expect(screen.getByTestId('PacOverview')).toBeDefined();
  });
});
