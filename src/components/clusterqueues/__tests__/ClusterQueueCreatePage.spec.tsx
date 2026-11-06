import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ChangeEvent } from 'react';
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
  k8sCreate: jest.fn(),
}));
jest.mock('../../hooks/useScrollShadows', () => ({
  useScrollShadows: () => 'none',
  Shadows: {},
}));
jest.mock('../../pipeline-builder/CodeEditorField', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { useFormikContext } =
    jest.requireActual<typeof import('formik')>('formik');
  const MockYAMLEditor = ({ name }: { name: string }) => {
    const { values, setFieldValue } =
      useFormikContext<Record<string, string>>();
    return React.createElement('textarea', {
      'aria-label': 'YAML editor',
      value: values[name],
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) =>
        setFieldValue(name, event.target.value),
    });
  };
  return {
    __esModule: true,
    default: MockYAMLEditor,
  };
});

const mockFlavors = useResourceFlavors as jest.Mock;
const { k8sCreate: mockK8sCreate } = jest.requireMock(
  '@openshift-console/dynamic-plugin-sdk',
);
const renderPage = (from?: string) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/create', state: { from } }]}>
      <Routes>
        <Route path="/create" element={<ClusterQueueCreatePage />} />
        <Route path="/pipelines/*" element={<p>Pipelines destination</p>} />
        <Route
          path="/k8s/cluster/:reference/:name"
          element={<p>ClusterQueue details</p>}
        />
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
  mockK8sCreate.mockReset();
  mockK8sCreate.mockResolvedValue({});
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

it('edits the form and adds/removes quota rows', async () => {
  renderPage();
  expect(
    screen.getByRole('heading', { name: 'Create ClusterQueue' }),
  ).toBeDefined();
  expect(screen.queryByLabelText(/Namespace/)).toBeNull();
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true),
  );
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
  expect(
    (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it('creates a ClusterQueue and opens its details page', async () => {
  renderPage();
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'fleet-cq' },
  });
  await selectOption('Resource flavor', 'default-flavor');
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );

  fireEvent.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() =>
    expect(mockK8sCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({ name: 'fleet-cq' }),
        }),
      }),
    ),
  );
  expect(await screen.findByText('ClusterQueue details')).toBeDefined();
});

it('creates a quota-less ClusterQueue from valid YAML', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));
  const yamlEditor = await screen.findByLabelText('YAML editor');
  fireEvent.change(yamlEditor, {
    target: {
      value: `apiVersion: kueue.x-k8s.io/v1beta2
kind: ClusterQueue
metadata:
  name: quota-less-cq
spec:
  namespaceSelector: {}`,
    },
  });

  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() =>
    expect(mockK8sCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { name: 'quota-less-cq' },
          spec: { namespaceSelector: {} },
        }),
      }),
    ),
  );
});

it('keeps Create disabled for YAML without a name', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));

  await screen.findByLabelText('YAML editor');
  expect(
    (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

it('requires a quota after switching quota-less YAML to Form view', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));
  const yamlEditor = await screen.findByLabelText('YAML editor');
  fireEvent.change(yamlEditor, {
    target: {
      value: `apiVersion: kueue.x-k8s.io/v1beta2
kind: ClusterQueue
metadata:
  name: quota-less-cq
spec:
  namespaceSelector: {}`,
    },
  });

  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('radio', { name: 'Form view' }));

  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true),
  );
});

it('shows a create API error', async () => {
  mockK8sCreate.mockRejectedValueOnce(new Error('Forbidden'));
  renderPage();
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'fleet-cq' },
  });
  await selectOption('Resource flavor', 'default-flavor');
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );

  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(await screen.findByText('Forbidden')).toBeDefined();
});

it('shows validation feedback when a required name is left empty', async () => {
  renderPage();
  fireEvent.blur(screen.getByLabelText(/^Name/));
  expect(await screen.findByText(/Required$/)).toBeDefined();
});

it('keeps the form and YAML views in sync', async () => {
  renderPage();
  fireEvent.change(screen.getByLabelText(/^Name/), {
    target: { value: 'form-cq' },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));

  const yamlEditor = await screen.findByLabelText('YAML editor');
  expect((yamlEditor as HTMLTextAreaElement).value).toContain('name: form-cq');

  fireEvent.change(yamlEditor, {
    target: {
      value: (yamlEditor as HTMLTextAreaElement).value.replace(
        'name: form-cq',
        'name: yaml-cq',
      ),
    },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Form view' }));

  await waitFor(() =>
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe(
      'yaml-cq',
    ),
  );
});

it('keeps invalid YAML open until it is fixed', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('radio', { name: 'YAML view' }));
  const yamlEditor = await screen.findByLabelText('YAML editor');
  const validYAML = (yamlEditor as HTMLTextAreaElement).value;
  fireEvent.change(yamlEditor, {
    target: { value: 'apiVersion: [' },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Form view' }));

  expect(
    await screen.findByText('Fix the YAML before switching to Form view.'),
  ).toBeDefined();
  expect(screen.getByLabelText('YAML editor')).toBeDefined();

  fireEvent.change(yamlEditor, { target: { value: validYAML } });
  await waitFor(() =>
    expect(
      screen.queryByText('Fix the YAML before switching to Form view.'),
    ).toBeNull(),
  );
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
