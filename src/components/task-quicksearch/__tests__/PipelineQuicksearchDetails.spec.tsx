import {
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
  configure,
} from '@testing-library/react';
import { cloneDeep, omit } from 'lodash';
import { MemoryRouter } from 'react-router';
import {
  sampleTaskCatalogItem,
  sampleArtifactHubCatalogItem,
} from './catalog-item-data';
import PipelineQuickSearchDetails from '../PipelineQuickSearchDetails';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';

configure({ testIdAttribute: 'data-test' });

const useFlagMock = useFlag as jest.Mock;

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

// FIXME Remove this code when jest is updated to at least 25.1.0 -- see https://github.com/jsdom/jsdom/issues/1555
if (!Element.prototype.closest) {
  Element.prototype.closest = function (this: Element, selector: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let el: Element | null = this;
    while (el) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  };
}

beforeEach(() => {
  useFlagMock.mockReturnValue(true);
});

describe('pipelineQuickSearchDetails', () => {
  const taskProps = {
    selectedItem: sampleTaskCatalogItem,
    closeModal: jest.fn(),
  };

  const artifactHubProps = {
    selectedItem: sampleArtifactHubCatalogItem,
    closeModal: jest.fn(),
  };

  afterEach(() => cleanup());

  describe('Installed badge tests', () => {
    it('should show the installed badge for the cluster task', async () => {
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).not.toBeNull();
      });
    });

    it('should show the installed badge for the installed artifact hub task', async () => {
      const installedArtifactHubTask = {
        ...sampleArtifactHubCatalogItem,
        attributes: {
          ...sampleArtifactHubCatalogItem.attributes,
          installed: '0.1',
        },
      };
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...artifactHubProps}
            selectedItem={installedArtifactHubTask}
          />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).not.toBeNull();
      });
    });

    it('should not show the installed badge for the uninstalled artifact hub task', async () => {
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...artifactHubProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-installed-badge')).toBeNull();
      });
    });
  });

  describe('CTA button tests', () => {
    it('should show Install and add button when versions are empty', async () => {
      const taskWithoutVersion = cloneDeep({
        ...artifactHubProps.selectedItem,
      });
      taskWithoutVersion.attributes.versions = [];
      const { getByRole } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...artifactHubProps}
            selectedItem={taskWithoutVersion}
          />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(getByRole('button', { name: 'Install and add' })).not.toBeNull();
      });
    });

    it('Add button should be enabled if the versions is not available in the user created task', async () => {
      const customTask = omit(taskProps.selectedItem, 'attributes.versions');
      const { getByRole } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} selectedItem={customTask} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        const button = getByRole('button', { name: 'Add' });
        expect(button).not.toBeNull();
        expect(button.getAttribute('aria-disabled')).not.toBe('true');
      });
    });

    it('Add button should be enabled if the versions is not available', async () => {
      const { getByRole } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        const button = getByRole('button', { name: 'Add' });
        expect(button).not.toBeNull();
        expect(button.getAttribute('aria-disabled')).not.toBe('true');
      });
    });

    it('should show the Add button for already installed task', async () => {
      const { getByRole } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(getByRole('button', { name: 'Add' })).not.toBeNull();
      });
    });

    it('should show the Install and add button for uninstalled artifact hub task', async () => {
      const { getByRole } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...artifactHubProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(getByRole('button', { name: 'Install and add' })).not.toBeNull();
      });
    });

    it('should show the Update and add button for already installed task', async () => {
      const installedArtifactHubTask = {
        ...sampleArtifactHubCatalogItem,
        attributes: {
          ...sampleArtifactHubCatalogItem.attributes,
          installed: '0.1',
        },
      };
      const { getByRole, queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...artifactHubProps}
            selectedItem={installedArtifactHubTask}
          />
        </MemoryRouter>,
      );
      await waitFor(async () => {
        fireEvent.click(queryByTestId('task-version'));
        fireEvent.click(screen.getByText('0.2'));
        expect(getByRole('button', { name: 'Update and add' })).not.toBeNull();
      });
    });
  });

  describe('Version dropdown tests', () => {
    it('should show the version dropdown if the versions are available', async () => {
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-version-dropdown')).not.toBeNull();
      });
    });

    it('should not show the version dropdown if the versions are not available', async () => {
      const selectedItem = omit(taskProps.selectedItem, 'attributes.versions');
      selectedItem.attributes.versions = [];
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...taskProps}
            selectedItem={selectedItem}
          />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-version-dropdown')).toBeNull();
      });
    });
  });

  describe('Category labels', () => {
    it('should show the category labels if the categories are available', async () => {
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-category-list')).not.toBeNull();
      });
    });

    it('should not show the category labels if the categories are not available', async () => {
      const selectedItem = omit(
        taskProps.selectedItem,
        'attributes.categories',
      );
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...taskProps}
            selectedItem={selectedItem}
          />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-category-list')).toBeNull();
      });
    });
  });

  describe('Tag labels', () => {
    it('should show the tag labels if the tag are available', async () => {
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails {...taskProps} />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-tag-list')).not.toBeNull();
      });
    });

    it('should not show the tag labels if the tags are not available', async () => {
      const selectedItem = omit(taskProps.selectedItem, 'tags');
      const { queryByTestId } = render(
        <MemoryRouter>
          <PipelineQuickSearchDetails
            {...taskProps}
            selectedItem={selectedItem}
          />
        </MemoryRouter>,
      );
      await waitFor(() => {
        expect(queryByTestId('task-tag-list')).toBeNull();
      });
    });
  });
});
