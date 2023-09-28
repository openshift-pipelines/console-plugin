import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB } from '../../consts';

export const useFlagHookProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(
    FLAG_HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_DETAIL_METRICS_TAB,
    true,
  );
};
