import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useResourceFlavors } from '../../hooks/useMultiKueueResources';
import ClusterQueueCreatePage from '../ClusterQueueCreatePage';

jest.mock('react-i18next', () => {
  const { t } = jest.requireActual('../../../../__mocks__/react-i18next');
  return { useTranslation: () => ({ t }) };
});
jest.mock('../../hooks/useMultiKueueResources', () => ({
  useResourceFlavors: jest.fn(),
}));
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  DocumentTitle: () => null,
  RedExclamationCircleIcon: () => null,
}));
jest.mock('../../hooks/useScrollShadows', () => ({
  useScrollShadows: () => 'none',
  Shadows: {},
}));

const mockFlavors = useResourceFlavors as jest.Mock;
const renderPage = (from?: string) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/create', state: { from } }]}>
      <Routes>
        <Route path="/create" element={<ClusterQueueCreatePage />} />
        <Route path="/pipelines/*" element={<p>Pipelines destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
const selectOption = async (label: string, option: string) => {
  fireEvent.click(screen.getAllByLabelText(new RegExp(`^${label}`))[0]);
  const item = await screen.findByRole('option', { name: option });
  await act(async () => {
    fireEvent.click(item);
  });
};

beforeEach(() => {
  mockFlavors.mockReturnValue([
    [
      {
        metadata: { name: 'default-flavor' },
        spec: { nodeLabels: { 'kubernetes.io/arch': 'amd64' } },
      },
    ],
    true,
    undefined,
  ]);
});

it('edits the form and adds/removes quota rows without submitting a resource', async () => {
  renderPage();
  expect(
    screen.getByRole('heading', { name: 'Create ClusterQueue' }),
  ).toBeDefined();
  expect(screen.queryByLabelText(/Namespace/)).toBeNull();
  expect(
    (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.getByLabelText(/^CPU/).textContent).toBe('4 cores');
  expect(screen.getByLabelText(/^Memory/).textContent).toBe('8Gi');

  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'fleet-cq' },
  });
  fireEvent.change(screen.getByLabelText('Cohort'), {
    target: { value: 'platform' },
  });
  fireEvent.click(screen.getByRole('radio', { name: /Strict FIFO/ }));
  await selectOption('Resource flavor', 'default-flavor');
  expect(screen.getByText('kubernetes.io/arch=amd64')).toBeDefined();
  await selectOption('Memory', '32Gi');
  await selectOption('CPU', '8 cores');
  await waitFor(() =>
    expect(screen.getByLabelText(/^Memory/).textContent).toBe('32Gi'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(screen.getAllByLabelText(/^Resource flavor/)).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Add flavor' }));
  await waitFor(() =>
    expect(screen.getAllByLabelText(/^Resource flavor/)).toHaveLength(2),
  );
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
  await waitFor(() =>
    expect(screen.getAllByLabelText(/^Resource flavor/)).toHaveLength(1),
  );
  expect(screen.getByLabelText(/^Memory/).textContent).toBe('32Gi');
  expect(screen.getByLabelText(/^CPU/).textContent).toBe('8 cores');
  expect(
    (screen.getByRole('radio', { name: /Strict FIFO/ }) as HTMLInputElement)
      .checked,
  ).toBe(true);
});

it('shows validation feedback when a required name is left empty', async () => {
  renderPage();
  fireEvent.blur(screen.getByLabelText(/^Name/));
  expect(await screen.findByText(/Required$/)).toBeDefined();
});

it.each([
  [false, undefined, 'Loading resource flavors...'],
  [true, new Error('Forbidden'), 'Unable to load resource flavors.'],
  [true, undefined, 'No resource flavors available.'],
])(
  'handles unavailable resource flavors (%s, %s)',
  (_loaded, _error, message) => {
    mockFlavors.mockReturnValue([[], _loaded, _error]);
    renderPage();
    expect(screen.getByText(message)).toBeDefined();
    expect(
      (screen.getByLabelText(/^Resource flavor/) as HTMLButtonElement).disabled,
    ).toBe(true);
  },
);

it.each([
  [
    '/pipelines/ns/demo/pipeline-runs?sortBy=Started',
    '/pipelines/ns/demo/pipeline-runs?sortBy=Started',
  ],
  ['https://example.com', '/pipelines/all-namespaces'],
])('returns to the Pipelines page from %s', (from, expected) => {
  renderPage(from);
  expect(
    screen.getByRole('link', { name: 'Pipelines' }).getAttribute('href'),
  ).toBe(expected);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByText('Pipelines destination')).toBeDefined();
});
