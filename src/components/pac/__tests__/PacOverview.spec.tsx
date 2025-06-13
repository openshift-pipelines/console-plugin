import * as React from 'react';
import { render, screen } from '@testing-library/react';
import PacOverview from '../PacOverview';
import { sampleSecretData } from '../../../test-data/pac-data';

jest.mock('../hooks/usePacGHManifest', () => ({
  usePacGHManifest: jest.fn(),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  NamespaceBar: () => <div data-test="mock-namespace-bar" />,
  ListPageHeader: () => <div data-test="mock-list-page-header" />,
  ResourceLink: (props: any) => (
    <div data-test="mock-resource-link">{JSON.stringify(props)}</div>
  ),
}));

jest.mock('../../common/LinkTo', () => ({
  LinkTo: () => 'a',
}));

describe('PacOverview', () => {
  const defaultProps = {
    namespace: 'openshift-pipelines',
    secret: sampleSecretData,
  };

  it('should show success alert if first flow and secret exists', () => {
    render(<PacOverview {...defaultProps} showSuccessAlert />);
    expect(screen.getByTestId('success-alert')).toBeDefined();
  });

  it('should not show success alert if not first flow and secret exists', () => {
    render(<PacOverview {...defaultProps} />);
    expect(screen.queryByTestId('success-alert')).toBeNull();
  });

  it('should show hint if not first flow and secret exists', () => {
    render(<PacOverview {...defaultProps} />);
    expect(screen.getByTestId('hint-section-id')).toBeDefined();
  });

  it('should not show hint if first flow', () => {
    render(<PacOverview {...defaultProps} showSuccessAlert />);
    expect(screen.queryByTestId('hint-section-id')).toBeNull();
  });

  it('should show danger alert if there is an error', () => {
    render(<PacOverview {...defaultProps} loadError={new Error('error')} />);
    const alertTitle = screen.getByTestId('danger-alert');
    expect(alertTitle).toBeDefined();
    const alertContainer = alertTitle.closest('.pf-m-danger');
    expect(alertContainer).toBeTruthy();
  });

  it('should show danger alert if secret does not exist', () => {
    render(<PacOverview {...defaultProps} secret={undefined} />);
    const alertTitle = screen.getByTestId('danger-alert');
    expect(alertTitle).toBeDefined();
    const alertContainer = alertTitle.closest('.pf-m-danger');
    expect(alertContainer).toBeTruthy();
  });
});
