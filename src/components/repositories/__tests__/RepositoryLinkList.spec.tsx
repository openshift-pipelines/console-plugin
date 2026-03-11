import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import { PipeLineRunWithRepoMetadata } from '../../../test-data/pipeline-data';
import { getLabelValue, sanitizeBranchName } from '../../utils/repository-utils';
import RepositoryLinkList from '../../pipelineRuns-details/RepositoryLinkList';

jest.mock('../../utils/repository-utils', () => ({
  getLabelValue: jest.fn(),
  sanitizeBranchName: jest.fn(),
  getGitProviderIcon: jest.fn(() => null),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceIcon: () => null,
  getGroupVersionKindForModel: jest.fn(() => ({})),
}));

const getLabelValueMock = getLabelValue as jest.Mock;
const sanitizeBranchNameMock = sanitizeBranchName as jest.Mock;

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  jest.resetAllMocks();
  getLabelValueMock.mockReturnValue('pplugin__pipelines-console-plugin~Branch');
  sanitizeBranchNameMock.mockReturnValue('main');
});

describe('RepositoryLinkList', () => {
  it('should not render when repo label is missing', () => {
    const { container } = renderWithRouter(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithNoRepoLabel}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render repository links when repo label is present', () => {
    const { container } = renderWithRouter(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithRepoLabel}
      />,
    );
    expect(container.querySelector('[data-test="pl-repository-link"]')).not.toBeNull();
  });

  it('should render repository branch details when repo & branch label are present', () => {
    const { container } = renderWithRouter(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithBranchLabel}
      />,
    );
    expect(container.querySelector('[data-test="pl-repository-branch"]')).not.toBeNull();
  });

  it('should render commit id when repo & sha label are present', () => {
    const { container } = renderWithRouter(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithSHALabel}
      />,
    );
    expect(container.querySelector('a[href="https://www.github.com/dummy/commit/3212345"]')).not.toBeNull();
  });

  it('should render event type when repo & EventType label are present', () => {
    const { container } = renderWithRouter(
      <RepositoryLinkList
        pipelineRun={PipeLineRunWithRepoMetadata.PipelineRunWithEventTypeLabel}
      />,
    );
    expect(container.querySelector('[data-test="pl-event-type"]')).not.toBeNull();
  });
});
