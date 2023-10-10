import * as React from 'react';
import {
  K8sResourceCommon,
  SetFeatureFlag,
  k8sGet,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB,
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
} from '../../consts';
import { TektonResultModel } from '../../models';

export const useFlagHookProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(
    FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB,
    true,
  );
};

export const useTektonResultInstallProvider = (
  setFeatureFlag: SetFeatureFlag,
) => {
  const [data, setData] = React.useState<K8sResourceCommon>();
  React.useEffect(() => {
    const fetch = async () => {
      try {
        const resource = await k8sGet({
          model: TektonResultModel,
          name: 'result',
        });
        setData(resource);
      } catch (error) {
        console.log('Error: ', error);
      }
    };
    fetch();
  }, []);
  setFeatureFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED, data ? true : false);
};
