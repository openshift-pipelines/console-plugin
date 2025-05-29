import { act } from 'react-dom/test-utils';

import { k8sListItems } from '@openshift-console/dynamic-plugin-sdk';
import { routeELData } from '../../../../test-data/pac-data';
import { testHook } from '../../../../test-data/utils/hooks-utils';
import { usePacGHManifest } from '../usePacGHManifest';

const k8sListMock = k8sListItems as jest.Mock;

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  const originalModule = jest.requireActual(
    '@openshift-console/dynamic-plugin-sdk',
  );
  return {
    ...originalModule,
    k8sListItems: jest.fn(),
  };
});

describe('usePacGHManifest', () => {
  beforeEach(() => {
    k8sListMock.mockReturnValue(Promise.resolve([routeELData]));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return manifestData with webhook url and loaded true if eventlistener url is fetched', async () => {
    const { result, rerender } = testHook(() => usePacGHManifest());
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.manifestData).toBeDefined();
    expect(result.current.manifestData.hook_attributes.url).toEqual(
      'https://www.example.com',
    );
  });

  it('should return manifestData with webhook url as empty string and loaded true if eventlistener url is not present', async () => {
    k8sListMock.mockReturnValue(Promise.resolve([]));
    const { result, rerender } = testHook(() => usePacGHManifest());
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.manifestData).toBeDefined();
    expect(result.current.manifestData.hook_attributes.url).toEqual('');
  });
});
