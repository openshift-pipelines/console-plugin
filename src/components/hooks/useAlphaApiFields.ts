import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { ConfigMapModel } from '../../models';
import { PIPELINE_NAMESPACE } from '../../consts';
import { useK8sGet } from './use-k8sGet-hook';

type FeatureFlagsConfigMap = K8sResourceCommon & {
  data?: { 'enable-api-fields'?: string };
};

export const useAlphaApiFields = (): [boolean, boolean] => {
  const [configMap, loaded, loadError] = useK8sGet<FeatureFlagsConfigMap>(
    ConfigMapModel,
    'feature-flags',
    PIPELINE_NAMESPACE,
  );

  const isAlpha =
    loaded && !loadError && configMap?.data?.['enable-api-fields'] === 'alpha';

  return [isAlpha, loaded];
};
