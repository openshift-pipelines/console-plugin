import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { DomainPropType, DomainTuple } from 'victory-core';
import {
  Chart,
  ChartAxis,
  ChartAxisProps,
  ChartDonut,
  ChartGroup,
  ChartLabel,
  ChartLegend,
  ChartLine,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Popover,
} from '@patternfly/react-core';
import { chart_color_black_200 as othersColor } from '@patternfly/react-tokens/dist/js/chart_color_black_200';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import {
  t_chart_global_danger_color_100 as failureColor,
} from '@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import {
  formatDate,
  getXaxisValues,
  hourformat,
  parsePrometheusDuration,
  monthYear,
} from './dateTime';
import './PipelinesOverview.scss';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespacePoll,
  usePipelineMetricsForNamespaceForPipelinePoll,
} from '../pipelines-metrics/hooks';
import {
  MetricsQueryPrefix,
  PipelineQuery,
  adjustToStartOfWeek,
} from '../pipelines-metrics/utils';
import { getTotalPipelineRuns, isMatchingFirstTickValue } from './utils';
import { LoadingInline } from '../Loading';

interface PipelinesRunsStatusCardProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
  namespace: string;
  interval: number;
  parentName?: string;
}

type DomainType = { x?: DomainTuple; y?: DomainTuple };

const getStatusSummary = (promQueryToSummaryResponse) => {
  const result = {
    cancelled: 0,
    failed: 0,
    succeeded: 0,
    total: 0,
  };
  promQueryToSummaryResponse?.forEach((item) => {
    result.cancelled += item.cancelled;
    result.failed += item.failed;
    result.succeeded += item.succeeded;
    result.total = result.cancelled + result.failed + result.succeeded;
  });

  return result;
};

export const getChartDataK8s = (
  tickValues: number[] | Date[],
  data: any,
  key: string,
  type: string,
): {
  x: number;
  y: number;
  name: string;
}[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const k = key.toLowerCase();
  const sortedTickValues = tickValues.slice().sort((a, b) => a - b);
  const chartData = sortedTickValues?.map((value, index) => {
    if (index === 0) {
      // Ensure the first value is always 0
      return {
        x: value,
        y: 0,
        name: t(key),
      };
    }
    const s = data?.find((d) => {
      const group_date = new Date(Number(d.group_value) * 1000);
      if (type == 'hour') {
        return group_date.getHours() === value;
      }
      if (type == 'week') {
        const adjustedGroupDate = adjustToStartOfWeek(new Date(group_date));
        return (
          adjustedGroupDate.toDateString() === new Date(value).toDateString()
        );
      }
      if (type == 'day') {
        return group_date.toDateString() === new Date(value).toDateString();
      }
      if (type == 'month') {
        return group_date.getMonth() === value.getMonth();
      }
    });
    return {
      x: value,
      y: Math.round((100 * s?.[k]) / s?.total) || 0,
      name: t(key),
    };
  });
  return chartData;
};

export const getIncrementedValues = (
  data,
  tickValues: number[] | Date[],
  type: string,
) => {
  const originalData = JSON.parse(JSON.stringify(data));
  for (let i = 1; i < data.length; i++) {
    const prevCancelled = originalData[i - 1].cancelled;
    const currentCancelled = originalData[i].cancelled;
    data[i].cancelled =
      currentCancelled >= prevCancelled
        ? currentCancelled - prevCancelled
        : currentCancelled;

    const prevFailed = originalData[i - 1].failed;
    const currentFailed = originalData[i].failed;
    data[i].failed =
      currentFailed >= prevFailed ? currentFailed - prevFailed : currentFailed;

    const prevSucceeded = originalData[i - 1].succeeded;
    const currentSucceeded = originalData[i].succeeded;
    data[i].succeeded =
      currentSucceeded >= prevSucceeded
        ? currentSucceeded - prevSucceeded
        : currentSucceeded;
  }

  const firstTickValue = tickValues[0];
  data.forEach((item) => {
    item.total = item.cancelled + item.failed + item.succeeded;
    const isMatch = isMatchingFirstTickValue(
      firstTickValue,
      item.group_value,
      type,
    );
    if (isMatch) {
      data[0].cancelled = 0;
      data[0].failed = 0;
      data[0].succeeded = 0;
    }
  });

  return data;
};

const transformPrometheusResultToSummary = (
  prometheusResult: PrometheusResponse,
  tickValues: number[] | Date[],
  type: string,
) => {
  const summary = [];
  if (
    prometheusResult &&
    prometheusResult.data &&
    prometheusResult.data.result
  ) {
    prometheusResult.data.result.forEach((metric) => {
      metric.values.forEach((value) => {
        const groupValue = value[0];

        let summaryObj = summary.find((obj) => obj.group_value === groupValue);

        if (!summaryObj) {
          summaryObj = {
            group_value: groupValue,
            cancelled: 0,
            failed: 0,
            succeeded: 0,
          };
          summary.push(summaryObj);
        }

        switch (metric.metric.status) {
          case 'cancelled':
            summaryObj.cancelled = parseInt(value[1], 10);
            break;
          case 'failed':
            summaryObj.failed = parseInt(value[1], 10);
            break;
          case 'success':
            summaryObj.succeeded = parseInt(value[1], 10);
            break;
          default:
            break;
        }
      });
    });
  }
  summary.sort((a, b) => a.group_value - b.group_value);
  const finalResult = getIncrementedValues(summary, tickValues, type);
  return finalResult;
};

const PipelineRunsStatusCardK8s: React.FC<PipelinesRunsStatusCardProps> = ({
  timespan,
  domain,
  bordered,
  namespace,
  interval,
  parentName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const startTimespan = timespan - parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const startDate = new Date(Date.now() - startTimespan).setHours(0, 0, 0, 0);
  const { x: domainX, y: domainY } = (domain as DomainType) || {};
  const domainValue: DomainPropType = {
    x: domainX || [startDate, endDate],
    y: domainY || undefined,
  };
  const [pipelineRunsStatusError, setPipelineRunsStatusError] = React.useState<
    string | null
  >(null);
  const [
    runSuccessRatioData,
    runSuccessRatioError,
    loadingRunSuccessRatioData,
  ] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE_FOR_PIPELINE,
          timeout: 90000,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_ALL_NAMESPACE,
          timeout: 90000,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_STATUS_FOR_NAMESPACE,
          timeout: 90000,
        });
  const [
    totalPipelineRunsData,
    totalPipelineRunsError,
    loadingTotalPipelineRunsData,
  ] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE,
          timeout: 90000,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_ALL_NAMESPACE,
          timeout: 90000,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE,
          timeout: 90000,
        });

  const [tickValues, type] = getXaxisValues(timespan);

  const totalPipelineRuns = React.useMemo(() => {
    if (totalPipelineRunsError) {
      return [];
    }
    return getTotalPipelineRuns(totalPipelineRunsData, tickValues, type);
  }, [totalPipelineRunsData, tickValues, type, totalPipelineRunsError]);

  const promQueryToSummaryResponse = React.useMemo(() => {
    if (runSuccessRatioError) {
      return [];
    }
    return transformPrometheusResultToSummary(
      runSuccessRatioData,
      tickValues,
      type,
    );
  }, [runSuccessRatioData, tickValues, type, runSuccessRatioError]);

  let xTickFormat;
  let dayLabel;
  let showLabel = false;
  let chartDataSucceededK8s = [];
  let chartDataFailedK8s = [];
  let chartDataCancelledK8s = [];
  switch (type) {
    case 'hour':
      xTickFormat = (d) => hourformat(d);
      showLabel = true;
      domainValue.x = [0, 23];

      dayLabel = formatDate(new Date());

      chartDataCancelledK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Cancelled',
        'hour',
      );
      chartDataSucceededK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Succeeded',
        'hour',
      );
      chartDataFailedK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Failed',
        'hour',
      );
      break;
    case 'day':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [startDate, endDate];

      chartDataCancelledK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Cancelled',
        'day',
      );
      chartDataSucceededK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Succeeded',
        'day',
      );
      chartDataFailedK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Failed',
        'day',
      );

      break;
    case 'week':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];

      chartDataCancelledK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Cancelled',
        'week',
      );
      chartDataSucceededK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Succeeded',
        'week',
      );
      chartDataFailedK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Failed',
        'week',
      );

      break;
    case 'month':
      xTickFormat = (d) => monthYear(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];

      chartDataCancelledK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Cancelled',
        'month',
      );
      chartDataSucceededK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Succeeded',
        'month',
      );
      chartDataFailedK8s = getChartDataK8s(
        tickValues,
        promQueryToSummaryResponse,
        'Failed',
        'month',
      );

      break;
    default:
      console.log('Received wrong data');
      break;
  }

  let xAxisStyle: ChartAxisProps['style'] = {
    tickLabels: {
      fill: 'var(--pf-t--global--text--color--regular)',
    },
  };
  const yAxisStyle: ChartAxisProps['style'] = {
    tickLabels: {
      fill: 'var(--pf-t--global--text--color--regular)',
    },
  };
  if (tickValues?.length > 7) {
    xAxisStyle = {
      tickLabels: {
        fill: 'var(--pf-t--global--text--color--regular)',
        angle: 320,
        fontSize: 10,
        textAnchor: 'end',
        verticalAnchor: 'end',
      },
    };
  }

  const colorScale = [
    successColor.value,
    failureColor.value,
    runningColor.value,
    cancelledColor.value,
    othersColor.value,
  ];

  const colorScaleLineChart = [
    successColor.value,
    failureColor.value,
    cancelledColor.value,
    othersColor.value,
  ];

  const donutDataObjK8s = React.useMemo(() => {
    if (totalPipelineRunsError || runSuccessRatioError) {
      return;
    }
    return getStatusSummary(promQueryToSummaryResponse);
  }, [
    promQueryToSummaryResponse,
    totalPipelineRunsError,
    runSuccessRatioError,
  ]);

  const donutDataK8s = [
    {
      x: t('Succeeded'),
      y: Math.round(
        (100 * donutDataObjK8s?.succeeded) / donutDataObjK8s?.total,
      ),
    },
    {
      x: t('Failed'),
      y: Math.round((100 * donutDataObjK8s?.failed) / donutDataObjK8s?.total),
    },

    {
      x: t('Cancelled'),
      y: Math.round(
        (100 * donutDataObjK8s?.cancelled) / donutDataObjK8s?.total,
      ),
    },
  ];

  const legendData = donutDataK8s.map((data) => {
    return {
      name: `${data.x}: ${isNaN(data.y) ? 0 : data.y}%`,
    };
  });

  React.useEffect(() => {
    const hasNonAbortError =
      (runSuccessRatioError && runSuccessRatioError.name !== 'AbortError') ||
      (totalPipelineRunsError && totalPipelineRunsError.name !== 'AbortError');
    setPipelineRunsStatusError(
      hasNonAbortError
        ? runSuccessRatioError?.message ??
            totalPipelineRunsError?.message ??
            t('Unable to load PipelineRun status')
        : null,
    );
  }, [runSuccessRatioError, totalPipelineRunsError]);

  return (
    <>
      <Card
        className={classNames('pipeline-overview__pipelinerun-status-card', {
          'card-border': bordered,
        })}
      >
        <CardTitle className="pipeline-overview__pipelinerun-status-card__title">
          <span>
            {t('PipelineRun status')}{' '}
            <Popover
              bodyContent={
                <>
                  {t(
                    'PipelineRun status shows the % of PipelineRuns for various statuses like "Succeeded", "Failed" and "Cancelled".',
                  )}
                </>
              }
            >
              <span
                role="button"
                aria-label={t('More info')}
                className="ocs-getting-started-grid__tooltip-icon"
              >
                <OutlinedQuestionCircleIcon />
              </span>
            </Popover>
          </span>
        </CardTitle>
        <CardBody className="pipeline-overview__pipelinerun-status-card__title">
          {pipelineRunsStatusError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load PipelineRun status')}
              className="pf-v6-u-mb-md"
            />
          ) : (
            <Grid>
              <GridItem xl2={4} xl={12} lg={12} md={12} sm={12}>
                {loadingRunSuccessRatioData ? (
                  <LoadingInline />
                ) : (
                  <div className="pipeline-overview__pipelinerun-status-card__donut-chart-div">
                    <ChartDonut
                      constrainToVisibleArea={true}
                      data={donutDataK8s}
                      labels={({ datum }) => `${datum.x}: ${datum.y}%`}
                      legendData={legendData}
                      colorScale={colorScale}
                      legendOrientation="vertical"
                      legendPosition="right"
                      padding={{
                        bottom: 30,
                        right: 140, // Adjusted to accommodate legend
                        top: 20,
                      }}
                      legendComponent={
                        <ChartLegend
                          data={legendData}
                          style={{
                            labels: {
                              fill: 'var(--pf-t--global--text--color--regular)',
                              fontSize: 14,
                            },
                          }}
                        />
                      }
                      subTitle={t('Succeeded')}
                      subTitleComponent={
                        <ChartLabel
                          style={{
                            fill: 'var(--pf-t--global--text--color--subtle)',
                            fontSize: 14,
                          }}
                        />
                      }
                      title={
                        typeof donutDataObjK8s !== 'undefined'
                          ? `${donutDataObjK8s?.succeeded}/${totalPipelineRuns}`
                          : ''
                      }
                      titleComponent={
                        <ChartLabel
                          style={{
                            fill: 'var(--pf-t--global--text--color--regular)',
                            fontSize: 24,
                          }}
                        />
                      }
                      width={350}
                    />
                  </div>
                )}
              </GridItem>
              <GridItem xl2={8} xl={12} lg={12} md={12} sm={12}>
                <div className="pipeline-overview__pipelinerun-status-card__bar-chart-div">
                  {loadingTotalPipelineRunsData ? (
                    <LoadingInline />
                  ) : (
                    <Chart
                      containerComponent={
                        <ChartVoronoiContainer
                          labels={({ datum }) => `${datum.name}: ${datum.y}%`}
                          constrainToVisibleArea
                        />
                      }
                      scale={{ x: 'time', y: 'linear' }}
                      domain={domainValue}
                      domainPadding={{ x: [30, 25] }}
                      height={200}
                      padding={{
                        top: 20,
                        bottom: 40,
                        right: 40,
                        left: 50,
                      }}
                      colorScale={colorScaleLineChart}
                      width={1000}
                    >
                      <ChartAxis
                        tickValues={tickValues}
                        style={xAxisStyle}
                        tickFormat={xTickFormat}
                        label={showLabel ? dayLabel : ''}
                      />
                      <ChartAxis
                        dependentAxis
                        tickFormat={(v) => `${v}%`}
                        style={yAxisStyle}
                      />
                      <ChartGroup>
                        <ChartLine data={chartDataSucceededK8s} />
                        <ChartLine data={chartDataFailedK8s} />
                        <ChartLine data={chartDataCancelledK8s} />
                      </ChartGroup>
                    </Chart>
                  )}
                </div>
              </GridItem>
            </Grid>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelineRunsStatusCardK8s;
