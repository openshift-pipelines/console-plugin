import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { useCallback } from 'react';
import { USER_PREFERENCE_PREFIX } from '../../consts';

export const DEFAULT_DATASOURCE_VALUES = ['cluster-data'];

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

  const resetPreference = useCallback(() => {
    setPreference(DEFAULT_DATASOURCE_VALUES);
  }, [setPreference]);

  return {
    preference: preference ?? DEFAULT_DATASOURCE_VALUES,
    setPreference,
    resetPreference,
    loaded,
  };
};
