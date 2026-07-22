import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { useCallback } from 'react';
import { USER_PREFERENCE_PREFIX } from '../../consts';

export const DEFAULT_DATASOURCE_VALUES = ['cluster-data'];
const NO_DATASOURCE_FILTER = [];

// When persist is false, no ConfigMap entry is auto-created; sync is enabled when resourceType is defined.
export const useDatasourcePreference = (
  resourceType: string | undefined,
  persistPreference = false,
) => {
  const [preference, setPreference, loaded] = useUserPreference<string[]>(
    `${USER_PREFERENCE_PREFIX}.dataSource.${resourceType}`,
    persistPreference ? DEFAULT_DATASOURCE_VALUES : undefined,
    !!resourceType,
  );

  const clearPreference = useCallback(() => {
    setPreference(NO_DATASOURCE_FILTER);
  }, [setPreference]);

  return {
    preference: preference ?? (loaded ? DEFAULT_DATASOURCE_VALUES : NO_DATASOURCE_FILTER),
    setPreference,
    clearPreference,
    loaded,
  };
};
