import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { sampleSecretData } from '../../../test-data/pac-data';
import * as pacHooks from '../hooks/usePacData';
import PacForm from '../PacForm';
import PacOverview from '../PacOverview';
import PacPage from '../PacPage';
import { AccessDenied, ErrorPage404 } from '../../common/error';
import { LoadingBox } from '../../status/status-box';
import {
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';

// eslint-disable-next-line no-var
var mockNavigate = jest.fn();

// Mocks
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: jest.fn(),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  useAccessReview: jest.fn(),
  useFlag: jest.fn(),
}));

jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

describe('PacPage', () => {
  let wrapper: ShallowWrapper;
  let spyPacHooks;

  beforeEach(() => {
    (useAccessReview as jest.Mock).mockReturnValue([true, false]);
    (useFlag as jest.Mock).mockReturnValue(true);

    spyPacHooks = jest.spyOn(pacHooks, 'usePacData');
    spyPacHooks.mockReturnValue({
      loaded: true,
      secretData: sampleSecretData,
      loadError: null,
    });

    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/pac/ns/openshift-pipelines',
      search: '',
      hash: '',
      state: null,
      key: 'test-key',
    });

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift-pipelines',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should show 404, if pipeline operator is not installed', () => {
    (useFlag as jest.Mock).mockReturnValue(false);
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(ErrorPage404).exists()).toBe(true);
  });

  it('should return access denied, if user does not have access to create resources in openshift-pipelines', () => {
    (useAccessReview as jest.Mock).mockReturnValue([false, false]);
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(AccessDenied).exists()).toBe(true);
  });

  it('should show loading if resources are still being fetched', () => {
    spyPacHooks.mockReturnValue({
      loaded: false,
      secretData: undefined,
      loadError: null,
    });

    wrapper = shallow(<PacPage />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show pac form if no secret exists in openshift-pipelines ns', () => {
    spyPacHooks.mockReturnValue({
      loaded: true,
      secretData: undefined,
      loadError: null,
    });

    wrapper = shallow(<PacPage />);
    expect(wrapper.find(PacForm).exists()).toBe(true);
  });

  it('should show pac overview if secret exists in openshift-pipelines ns', () => {
    wrapper = shallow(<PacPage />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().secret).toEqual(sampleSecretData);
  });

  it('should show pac overview in case of any error with retrieving code or creating secret', () => {
    spyPacHooks.mockReturnValue({
      loaded: true,
      secretData: undefined,
      loadError: 'error',
    });

    wrapper = shallow(<PacPage />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().loadError).toEqual('error');
  });
});
