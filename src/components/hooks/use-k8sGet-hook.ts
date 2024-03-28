import {
  K8sKind,
  K8sModel,
  K8sResourceCommon,
  k8sGet,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';

export const useK8sGet = <R extends K8sResourceCommon = K8sResourceCommon>(
  kind: K8sModel | K8sKind,
  name?: string,
  namespace?: string,
): [R, boolean, unknown] => {
  const [data, setData] = React.useState<R>();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState();
  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        setLoaded(false);
        setData(null);
        const resource = await k8sGet<R>({ model: kind, name, ns: namespace });
        setData(resource);
      } catch (error) {
        setLoadError(error);
      } finally {
        setLoaded(true);
      }
    };
    fetch();
  }, [kind, name, namespace]);

  return [data, loaded, loadError];
};
