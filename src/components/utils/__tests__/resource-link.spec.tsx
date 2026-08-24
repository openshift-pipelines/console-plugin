import type { ReactElement } from 'react';
import { configure, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ResourceLinkWithIcon } from '../resource-link';
import { PipelineModel } from '../../../models';

configure({ testIdAttribute: 'data-test' });

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceIcon: ({ className }: { className?: string }) => (
    <span data-test="resource-icon" className={className} />
  ),
}));

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ResourceLinkWithIcon', () => {
  it('should render a link that opens in a new tab', () => {
    renderWithRouter(
      <ResourceLinkWithIcon
        groupVersionKind={{
          group: PipelineModel.apiGroup,
          version: PipelineModel.apiVersion,
          kind: PipelineModel.kind,
        }}
        model={PipelineModel}
        name="example-pipeline"
        namespace="test-ns"
        openInNewTab
      />,
    );

    const link = screen.getByRole('link', { name: 'example-pipeline' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should not set a new-tab target by default', () => {
    renderWithRouter(
      <ResourceLinkWithIcon
        groupVersionKind={{
          group: PipelineModel.apiGroup,
          version: PipelineModel.apiVersion,
          kind: PipelineModel.kind,
        }}
        model={PipelineModel}
        name="example-pipeline"
        namespace="test-ns"
      />,
    );

    const link = screen.getByRole('link', { name: 'example-pipeline' });
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('should render a large icon when largeIcon is true', () => {
    renderWithRouter(
      <ResourceLinkWithIcon
        groupVersionKind={{
          group: PipelineModel.apiGroup,
          version: PipelineModel.apiVersion,
          kind: PipelineModel.kind,
        }}
        model={PipelineModel}
        name="example-pipeline"
        namespace="test-ns"
        largeIcon
        linkTo={false}
      />,
    );

    expect(screen.getByTestId('resource-icon').className).toContain(
      'co-m-resource-icon--lg',
    );
  });

  it('should render plain text when linkTo is false', () => {
    renderWithRouter(
      <ResourceLinkWithIcon
        groupVersionKind={{
          group: PipelineModel.apiGroup,
          version: PipelineModel.apiVersion,
          kind: PipelineModel.kind,
        }}
        model={PipelineModel}
        name="example-pipeline"
        namespace="test-ns"
        displayName="Example Pipeline"
        linkTo={false}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Example Pipeline')).toBeTruthy();
  });
});
