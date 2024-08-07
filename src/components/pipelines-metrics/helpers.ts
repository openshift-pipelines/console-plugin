import { PrometheusEndpoint } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import {
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
  PROMETHEUS_TENANCY_BASE_PATH,
} from './const';

export { PrometheusEndpoint };

const getRangeVectorSearchParams = (
  endTime: number = Date.now(),
  samples: number = DEFAULT_PROMETHEUS_SAMPLES,
  timespan: number = DEFAULT_PROMETHEUS_TIMESPAN,
): URLSearchParams => {
  const params = new URLSearchParams();
  const now = new Date();
  if (timespan === 86400000) {
    // Set start to 12 AM today
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    params.append('start', `${startOfDay.getTime() / 1000}`);

    // Set end to 11 PM today
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      0,
      0,
    );
    params.append('end', `${endOfDay.getTime() / 1000}`);

    // Set step to 3600 seconds (1 hour)
    params.append('step', '3600');
  } else if (timespan === 1209600000) {
    // 14 days in milliseconds
    // Set start to 14 days ago
    const startOfFourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );
    params.append('start', `${startOfFourteenDaysAgo.getTime() / 1000}`);

    // Set end to now
    params.append('end', `${endTime / 1000}`);
    params.append('step', '86400');
  } else if (timespan === 2592000000) {
    // 30 days in milliseconds
    // Set start to 30 days ago
    const startOfThirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
    params.append('start', `${startOfThirtyDaysAgo.getTime() / 1000}`);

    // Set end to now
    params.append('end', `${endTime / 1000}`);
    params.append('step', '86400');
  } else if (timespan === 7257600000) {
    // 3 months in milliseconds
    // Set start to 3 months ago
    const startOfThreeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    params.append('start', `${startOfThreeMonthsAgo.getTime() / 1000}`);

    // Set end to now
    params.append('end', `${endTime / 1000}`);
    params.append('step', '604800');
  } else {
    params.append('start', `${(endTime - timespan) / 1000}`);
    params.append('end', `${endTime / 1000}`);
    params.append('step', `${timespan / samples / 1000}`);
  }
  return params;
};

const getSearchParams = ({
  endpoint,
  endTime,
  timespan,
  samples,
  ...params
}: PrometheusURLProps): URLSearchParams => {
  const searchParams =
    endpoint === PrometheusEndpoint.QUERY_RANGE
      ? getRangeVectorSearchParams(endTime, samples, timespan)
      : new URLSearchParams();
  _.each(
    params,
    (value, key) => value && searchParams.append(key, value.toString()),
  );
  return searchParams;
};

export const getPrometheusURL = (props: PrometheusURLProps): string => {
  if (props.endpoint !== PrometheusEndpoint.RULES && !props.query) {
    return '';
  }
  const params = getSearchParams(props);
  return `${PROMETHEUS_TENANCY_BASE_PATH}/${
    props.endpoint
  }?${params.toString()}`;
};

type PrometheusURLProps = {
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query?: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
};
