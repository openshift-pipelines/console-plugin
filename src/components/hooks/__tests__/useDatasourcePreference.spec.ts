import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { testHook } from '../../../test-data/utils/hooks-utils';
import {
  DEFAULT_DATASOURCE_VALUES,
  useDatasourcePreference,
} from '../useDatasourcePreference';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useUserPreference: jest.fn(),
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;

describe('useDatasourcePreference', () => {
  let setPreferenceMock: jest.Mock;

  beforeEach(() => {
    setPreferenceMock = jest.fn();
    useUserPreferenceMock.mockReturnValue([
      ['cluster-data'],
      setPreferenceMock,
      true,
    ]);
  });

  it('should return the persisted preference', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('pipelineRun', true),
    );
    expect(result.current.preference).toEqual(['cluster-data']);
    expect(result.current.loaded).toBe(true);
  });

  it('should fall back to default when preference is undefined', () => {
    useUserPreferenceMock.mockReturnValue([undefined, setPreferenceMock, true]);
    const { result } = testHook(() =>
      useDatasourcePreference('pipelineRun', true),
    );
    expect(result.current.preference).toEqual(DEFAULT_DATASOURCE_VALUES);
  });

  it('should persist value via setPreference', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('pipelineRun', true),
    );
    result.current.setPreference(['archived-data']);
    expect(setPreferenceMock).toHaveBeenCalledWith(['archived-data']);
  });

  it('should clear preference to empty array', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('pipelineRun', true),
    );
    result.current.clearPreference();
    expect(setPreferenceMock).toHaveBeenCalledWith([]);
  });

  it('should use the correct preference key for pipelineRun', () => {
    testHook(() => useDatasourcePreference('pipelineRun', true));
    expect(useUserPreferenceMock).toHaveBeenCalledWith(
      'plugin__pipelines-console-plugin.dataSource.pipelineRun',
      DEFAULT_DATASOURCE_VALUES,
      true,
    );
  });

  it('should pass undefined as default when persist is false', () => {
    testHook(() => useDatasourcePreference('Pipeline', false));
    expect(useUserPreferenceMock).toHaveBeenCalledWith(
      'plugin__pipelines-console-plugin.dataSource.Pipeline',
      undefined,
      true,
    );
  });
});
