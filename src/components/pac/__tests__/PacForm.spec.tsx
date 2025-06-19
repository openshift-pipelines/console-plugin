import * as React from 'react';
import { configure, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { usePacGHManifest } from '../hooks/usePacGHManifest';
import PacForm from '../PacForm';

configure({ testIdAttribute: 'data-test' });

jest.mock('../hooks/usePacGHManifest', () => ({
  usePacGHManifest: jest.fn(),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  NamespaceBar: () => <div data-test="mock-namespace-bar" />,
  ListPageHeader: () => <div data-test="mock-list-page-header" />,
}));

jest.mock('../../common/LinkTo', () => ({
  LinkTo: () => 'a',
}));
const mockUsePacGHManifest = usePacGHManifest as jest.Mock;

describe('PacForm', () => {
  const defaultProps = {
    namespace: 'openshift-pipelines',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('Should show loading if manifest is not loaded', () => {
    mockUsePacGHManifest.mockReturnValue({ loaded: false, manifestData: {} });

    render(<PacForm {...defaultProps} />);
    const loadingBox = screen.getByTestId('loading-indicator');
    expect(loadingBox).toBeDefined();
  });

  it('Should render form if manifest is loaded', () => {
    mockUsePacGHManifest.mockReturnValue({ loaded: true, manifestData: {} });

    render(
      <MemoryRouter>
        <PacForm {...defaultProps} />
      </MemoryRouter>,
    );
    const pageSection = screen.getByTestId('pac-form-page-section');
    const form = screen.getByTestId('form-setup-github-app');

    expect(pageSection).toBeDefined();
    expect(form).toBeDefined();
  });
});
