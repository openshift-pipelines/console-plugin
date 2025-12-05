import {
  PrometheusEndpoint,
  PrometheusResponse,
} from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import { getPrometheusURL } from './helpers';
import { useURLPoll } from './url-poll-hook';
import { metricsQueries, MetricsQueryPrefix, PipelineQuery } from './utils';

export const calculateTotalValues = (
  prometheusResponse: PrometheusResponse,
  timerangeSeconds: number,
): number => {
  const currentTime = Date.now() / 1000;

  const totalValues = prometheusResponse?.data?.result?.reduce(
    (total, current) => {
      const valuesInRange = current.values.filter(
        (value) => value[0] >= currentTime - timerangeSeconds,
      );
      const sumValues = _.sumBy(valuesInRange, (value) =>
        parseInt(value[1], 10),
      );
      return total + sumValues;
    },
    0,
  );

  return totalValues;
};

export const usePipelineMetricsForAllNamespacePoll = ({
  delay,
  timespan,
  queryPrefix,
  metricsQuery,
  timeout,
}: {
  delay: number;
  timespan: number;
  queryPrefix: MetricsQueryPrefix;
  metricsQuery: PipelineQuery;
  timeout?: number;
}) => {
  const queries = metricsQueries(queryPrefix);
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: queries[metricsQuery](),
      samples: 1,
      endTime: Date.now(),
      timespan,
    }),
    delay,
    timeout,
    timespan,
  );
};

export const usePipelineMetricsForNamespaceForPipelinePoll = ({
  delay,
  namespace,
  timespan,
  queryPrefix,
  name,
  metricsQuery,
  timeout,
}: {
  delay: number;
  namespace: string;
  timespan: number;
  queryPrefix: MetricsQueryPrefix;
  name: string;
  metricsQuery: PipelineQuery;
  timeout?: number;
}) => {
  const queries = metricsQueries(queryPrefix);
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: queries[metricsQuery]({
        name,
        namespace,
      }),
      samples: 1,
      endTime: Date.now(),
      timespan,
      namespace,
    }),
    delay,
    timeout,
    namespace,
    timespan,
  );
};

export const usePipelineMetricsForNamespacePoll = ({
  delay,
  namespace,
  timespan,
  queryPrefix,
  metricsQuery,
  timeout,
}: {
  delay: number;
  namespace: string;
  timespan: number;
  queryPrefix: MetricsQueryPrefix;
  metricsQuery: PipelineQuery;
  timeout?: number;
}) => {
  const queries = metricsQueries(queryPrefix);
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: queries[metricsQuery]({
        namespace,
      }),
      samples: 1,
      endTime: Date.now(),
      timespan,
      namespace,
    }),
    delay,
    timeout,
    namespace,
    timespan,
  );
};

export const getStatusCounts = (prometheusResponse: PrometheusResponse) => {
  const result = prometheusResponse?.data?.result;
  const counts = {
    success: 0,
    failed: 0,
    cancelled: 0,
  };
  if (!result) {
    return counts;
  }
  result.forEach((item) => {
    const status = item.metric.status;
    const value = parseInt(item.values[0][1], 10); // parse the count value from the string

    if (status === 'success') {
      counts.success += value;
    } else if (status === 'failed') {
      counts.failed += value;
    } else if (status === 'cancelled') {
      counts.cancelled += value;
    }
  });

  return counts;
};

export const calculateTotalDuration = (
  prometheusResponse: PrometheusResponse,
) => {
  const results = prometheusResponse?.data?.result;

  if (!results) {
    return 0;
  }

  const totalDuration = results.reduce((total, result) => {
    const values = result.values;
    return (
      total +
      values.reduce((resultTotal, value, index, array) => {
        if (index < array.length - 1) {
          const currentTimestamp = value[0];
          const nextTimestamp = array[index + 1][0];
          return resultTotal + (nextTimestamp - currentTimestamp);
        }
        return resultTotal;
      }, 0)
    );
  }, 0);

  return totalDuration;
};
