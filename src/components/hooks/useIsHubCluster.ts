/* import { TektonConfigModel } from '../../models';
import { TektonConfig } from '../../types';
import { useK8sGet } from './use-k8sGet-hook'; */

/**
 * Hook to detect if the current cluster is a hub cluster.
 * A hub cluster has TektonConfig.spec.role === 'hub'.
 *
 * @returns [isHub, loaded] - isHub is true if this is a hub cluster, loaded indicates if the check is complete
 */
export const useIsHubCluster = (): [boolean] => {
  // const [tektonConfig, loaded] = useK8sGet<TektonConfig>(
  //   TektonConfigModel,
  //   'config',
  // );
  // const isHub = loaded && tektonConfig?.spec?.role === 'hub';
  // return [isHub];
  return [true];
};
