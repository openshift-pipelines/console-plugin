import _ from 'lodash';

export enum PipelineQuery {
  PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE = 'PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE',
  PIPELINERUN_COUNT_FOR_STATUS_FOR_ALL_NAMESPACE = 'PIPELINERUN_COUNT_FOR_STATUS_FOR_ALL_NAMESPACE',
  PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE_FOR_PIPELINE = 'PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE_FOR_PIPELINE',
  PIPELINERUN_COUNT_FOR_NAMESPACE = 'PIPELINERUN_COUNT_FOR_NAMESPACE',
  PIPELINERUN_COUNT_FOR_ALL_NAMESPACE = 'PIPELINERUN_COUNT_FOR_ALL_NAMESPACE',
  PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE = 'PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE',
  PIPELINERUN_DURATION_FOR_NAMESPACE = 'PIPELINERUN_DURATION_FOR_NAMESPACE',
  PIPELINERUN_DURATION_FOR_ALL_NAMESPACE = 'PIPELINERUN_DURATION_FOR_ALL_NAMESPACE',
  PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE = 'PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE',
  PIPELINERUN_COUNT_WITH_METRIC_FOR_ALL_NAMESPACE = 'PIPELINERUN_COUNT_WITH_METRIC_FOR_ALL_NAMESPACE',
  PIPELINERUN_COUNT_WITH_METRIC_FOR_NAMESPACE = 'PIPELINERUN_COUNT_WITH_METRIC_FOR_NAMESPACE',
  PIPELINERUN_SUM_WITH_METRIC_FOR_ALL_NAMESPACE = 'PIPELINERUN_SUM_WITH_METRIC_FOR_ALL_NAMESPACE',
  PIPELINERUN_SUM_WITH_METRIC_FOR_NAMESPACE = 'PIPELINERUN_SUM_WITH_METRIC_FOR_NAMESPACE',
}

export enum MetricsQueryPrefix {
  TEKTON = 'tekton',
  TEKTON_PIPELINES_CONTROLLER = 'tekton_pipelines_controller',
}

export const metricsQueries = (
  prefix: string = MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
) => ({
  [PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE]: _.template(
    `sum by (status) (${prefix}_pipelinerun_duration_seconds_count{namespace="<%= namespace %>"})`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE_FOR_PIPELINE]:
    _.template(
      `sum by (status) (${prefix}_pipelinerun_duration_seconds_count{pipeline="<%= name %>",namespace="<%= namespace %>"})`,
    ),
  [PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_ALL_NAMESPACE]: _.template(
    `sum by (status) (${prefix}_pipelinerun_duration_seconds_count)`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_count{namespace="<%= namespace %>"})`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_count{pipeline="<%= name %>",namespace="<%= namespace %>"})`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_FOR_ALL_NAMESPACE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_count)`,
  ),
  [PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_sum{namespace="<%= namespace %>"})`,
  ),
  [PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_sum{pipeline="<%= name %>",namespace="<%= namespace %>"})`,
  ),
  [PipelineQuery.PIPELINERUN_DURATION_FOR_ALL_NAMESPACE]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_sum)`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_WITH_METRIC_FOR_ALL_NAMESPACE]: _.template(
    `${prefix}_pipelinerun_duration_seconds_count`,
  ),
  [PipelineQuery.PIPELINERUN_COUNT_WITH_METRIC_FOR_NAMESPACE]: _.template(
    `${prefix}_pipelinerun_duration_seconds_count{namespace="<%= namespace %>"}`,
  ),
  [PipelineQuery.PIPELINERUN_SUM_WITH_METRIC_FOR_ALL_NAMESPACE]: _.template(
    `${prefix}_pipelinerun_duration_seconds_sum`,
  ),
  [PipelineQuery.PIPELINERUN_SUM_WITH_METRIC_FOR_NAMESPACE]: _.template(
    `${prefix}_pipelinerun_duration_seconds_sum{namespace="<%= namespace %>"}`,
  ),
});

export const adjustToStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(date.setDate(diff));
};

export const secondsToMinutesK8s = (seconds: number): number => {
  const minutes = seconds / 60;
  return parseFloat(minutes.toFixed(2));
};
