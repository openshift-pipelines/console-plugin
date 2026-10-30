import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { renderHook } from '@testing-library/react';
import { ResourceFlavorKind } from '../../../types';
import { useK8sGet } from '../use-k8sGet-hook';
import { useResourceFlavors } from '../useMultiKueueResources';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
}));
jest.mock('../use-k8sGet-hook', () => ({ useK8sGet: jest.fn() }));

const mockGet = useK8sGet as jest.Mock;
const mockWatch = useK8sWatchResource as jest.Mock;
const hubConfig = { spec: { kueue: { 'multi-cluster-role': 'hub' } } };
const flavors: ResourceFlavorKind[] = [
  {
    metadata: { name: 'default-flavor' },
    spec: { nodeLabels: { 'kubernetes.io/arch': 'amd64' } },
  },
];

describe('useResourceFlavors', () => {
  beforeEach(() => {
    mockGet.mockReturnValue([hubConfig, true, undefined]);
    mockWatch.mockReturnValue([flavors, true, undefined]);
  });

  it('starts a cluster-scoped watch when hub detection completes and stops it when disabled', () => {
    mockGet.mockReturnValue([undefined, false, undefined]);
    const { result, rerender } = renderHook(useResourceFlavors);
    expect(mockWatch).toHaveBeenLastCalledWith(null);
    expect(result.current[1]).toBe(false);

    mockGet.mockReturnValue([hubConfig, true, undefined]);
    rerender();
    expect(mockWatch).toHaveBeenLastCalledWith({
      isList: true,
      groupVersionKind: {
        group: 'kueue.x-k8s.io',
        kind: 'ResourceFlavor',
        version: 'v1beta2',
      },
    });
    expect(result.current).toEqual([flavors, true, undefined]);

    mockGet.mockReturnValue([undefined, true, undefined]);
    rerender();
    expect(mockWatch).toHaveBeenLastCalledWith(null);
  });

  it.each([
    ['spoke', { spec: { kueue: { 'multi-cluster-role': 'spoke' } } }],
    [
      'disabled hub',
      {
        spec: {
          kueue: {
            'multi-cluster-role': 'hub',
            'multi-cluster-disabled': true,
          },
        },
      },
    ],
    ['unconfigured cluster', { spec: {} }],
    ['missing TektonConfig', undefined],
  ])('does not watch ResourceFlavors on a %s', (_description, config) => {
    mockGet.mockReturnValue([config, true, undefined]);
    renderHook(useResourceFlavors);
    expect(mockWatch).toHaveBeenLastCalledWith(null);
  });
});
