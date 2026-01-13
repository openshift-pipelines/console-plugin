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
import { t_chart_global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  formatDate,
  getDropDownDate,
  getXaxisValues,
  hourformat,
  parsePrometheusDuration,
  monthYear,
} from './dateTime';
import { getFilter, useInterval } from './utils';
import { getResultsSummary } from '../utils/summary-api';
import { LoadingInline } from '../Loading';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { DataType, FLAGS, SummaryResponse } from '../../types';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

interface PipelinesRunsStatusCardProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
  namespace: string;
  interval: number;
  kind?: string;
  parentName?: string;
}

type DomainType = { x?: DomainTuple; y?: DomainTuple };

const getChartData = (
  tickValues: number[] | Date[],
  data: SummaryResponse,
  key: string,
  type: string,
): {
  x: number;
  y: number;
  name: string;
}[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const k = key.toLowerCase();
  const chartData = tickValues?.map((value) => {
    const s = data?.summary?.find((d) => {
      const group_date = new Date(Number(d.group_value) * 1000);
      if (type == 'hour') {
        return group_date.getHours() === value;
      }
      if (type == 'day' || type == 'week') {
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

const PipelinesRunsStatusCard: React.FC<PipelinesRunsStatusCardProps> = ({
  timespan,
  domain,
  bordered,
  namespace,
  interval,
  parentName,
  kind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [data, setData] = React.useState<SummaryResponse>();
  const [data2, setData2] = React.useState<SummaryResponse>();
  const [loaded, setLoaded] = React.useState(false);
  const [pipelineRunsStatusError, setPipelineRunsStatusError] = React.useState<
    string | undefined
  >();
  const abortControllerRefDonut = React.useRef<AbortController>();
  const abortControllerRefLineChart = React.useRef<AbortController>();

  const startTimespan = timespan - parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const startDate = new Date(Date.now() - startTimespan).setHours(0, 0, 0, 0);
  const { x: domainX, y: domainY } = (domain as DomainType) || {};
  const domainValue: DomainPropType = {
    x: domainX || [startDate, endDate],
    y: domainY || undefined,
  };
  const date = getDropDownDate(timespan).toISOString();

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    return () => {
      abortControllerRefDonut.current?.abort();
      abortControllerRefLineChart.current?.abort();
    };
  }, []);

  const getSummaryData = (summary, setData, groupBy?, controller?) => {
    // Clear stale data before making new request
    setData(undefined);

    const summaryOpt = {
      summary,
      filter: getFilter(date, parentName, kind),
      data_type: DataType?.PipelineRun,
    };
    groupBy && (summaryOpt['groupBy'] = groupBy);
    setPipelineRunsStatusError(undefined);
    setLoaded(false);
    getResultsSummary(
      namespace,
      summaryOpt,
      undefined,
      isDevConsoleProxyAvailable,
      controller?.signal,
      90000,
    )
      .then((d) => {
        setLoaded(true);
        setPipelineRunsStatusError(undefined);
        setData(d);
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          // Request was cancelled, this is expected behavior
          return;
        }
        // Don't log to console, just show user-facing error
        setLoaded(true);
        setPipelineRunsStatusError(
          e.message || t('Failed to load pipeline run status data'),
        );
        // Clear stale data on error
        setData(undefined);
      });
  };

  useInterval(
    () => {
      abortControllerRefDonut.current?.abort();
      abortControllerRefDonut.current = new AbortController();
      getSummaryData(
        'succeeded,cancelled,failed,others,running,total',
        setData,
        undefined,
        abortControllerRefDonut.current,
      );
    },
    interval,
    namespace,
    date,
  );
  React.useEffect(() => {
    setLoaded(false);
    setPipelineRunsStatusError(undefined);
    // Clear stale data when namespace or timespan changes
    setData(undefined);
    setData2(undefined);
  }, [namespace, timespan]);
  const [tickValues, type] = getXaxisValues(timespan);

  let xTickFormat;
  let dayLabel;
  let showLabel = false;
  let chartDataSucceeded = [];
  let chartDataFailed = [];
  let chartDataCancelled = [];
  let chartDataOthers = [];
  switch (type) {
    case 'hour':
      xTickFormat = (d) => hourformat(d);
      showLabel = true;
      domainValue.x = [0, 23];
      useInterval(
        () => {
          abortControllerRefLineChart.current?.abort();
          abortControllerRefLineChart.current = new AbortController();
          getSummaryData(
            'succeeded,cancelled,failed,others,total',
            setData2,
            'hour',
            abortControllerRefLineChart.current,
          );
        },
        interval,
        namespace,
        date,
      );
      dayLabel = formatDate(new Date());
      chartDataSucceeded = getChartData(tickValues, data2, 'Succeeded', 'hour');
      chartDataFailed = getChartData(tickValues, data2, 'Failed', 'hour');
      chartDataCancelled = getChartData(tickValues, data2, 'Cancelled', 'hour');
      chartDataOthers = getChartData(tickValues, data2, 'Others', 'hour');
      break;
    case 'day':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [startDate, endDate];
      useInterval(
        () => {
          abortControllerRefLineChart.current?.abort();
          abortControllerRefLineChart.current = new AbortController();
          getSummaryData(
            'succeeded,cancelled,failed,others,total',
            setData2,
            'day',
            abortControllerRefLineChart.current,
          );
        },
        interval,
        namespace,
        date,
      );

      chartDataSucceeded = getChartData(tickValues, data2, 'Succeeded', 'day');
      chartDataFailed = getChartData(tickValues, data2, 'Failed', 'day');
      chartDataCancelled = getChartData(tickValues, data2, 'Cancelled', 'day');
      chartDataOthers = getChartData(tickValues, data2, 'Others', 'day');
      break;
    case 'week':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      useInterval(
        () => {
          abortControllerRefLineChart.current?.abort();
          abortControllerRefLineChart.current = new AbortController();
          getSummaryData(
            'succeeded,cancelled,failed,others,total',
            setData2,
            'week',
            abortControllerRefLineChart.current,
          );
        },
        interval,
        namespace,
        date,
      );

      chartDataSucceeded = getChartData(tickValues, data2, 'Succeeded', 'week');
      chartDataFailed = getChartData(tickValues, data2, 'Failed', 'week');
      chartDataCancelled = getChartData(tickValues, data2, 'Cancelled', 'week');
      chartDataOthers = getChartData(tickValues, data2, 'Others', 'week');
      break;
    case 'month':
      xTickFormat = (d) => monthYear(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      useInterval(
        () => {
          abortControllerRefLineChart.current?.abort();
          abortControllerRefLineChart.current = new AbortController();
          getSummaryData(
            'succeeded,cancelled,failed,others,total',
            setData2,
            'month',
            abortControllerRefLineChart.current,
          );
        },
        interval,
        namespace,
        date,
      );

      chartDataSucceeded = getChartData(
        tickValues,
        data2,
        'Succeeded',
        'month',
      );
      chartDataFailed = getChartData(tickValues, data2, 'Failed', 'month');
      chartDataCancelled = getChartData(
        tickValues,
        data2,
        'Cancelled',
        'month',
      );
      chartDataOthers = getChartData(tickValues, data2, 'Others', 'month');
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

  const donutData = [
    {
      x: t('Succeeded'),
      y: Math.round(
        (100 * data?.summary?.[0]?.succeeded) / data?.summary?.[0]?.total,
      ),
    },
    {
      x: t('Failed'),
      y: Math.round(
        (100 * data?.summary?.[0]?.failed) / data?.summary?.[0]?.total,
      ),
    },
    {
      x: t('Running'),
      y: Math.round(
        (100 * data?.summary?.[0]?.running) / data?.summary?.[0]?.total,
      ),
    },
    {
      x: t('Cancelled'),
      y: Math.round(
        (100 * data?.summary?.[0]?.cancelled) / data?.summary?.[0]?.total,
      ),
    },
    {
      x: t('Others'),
      y: Math.round(
        (100 * data?.summary?.[0]?.others) / data?.summary?.[0]?.total,
      ),
    },
  ];

  const legendData = donutData.map((data) => {
    return {
      name: `${data.x}: ${isNaN(data.y) ? 0 : data.y}%`,
    };
  });
  return (
    <>
      <Card
        className={classNames('pipeline-overview__pipelinerun-status-card', {
          'card-border': bordered,
        })}
      >
        <CardTitle>
          <span>
            {t('PipelineRun status')}{' '}
            <Popover
              bodyContent={
                <>
                  {t(
                    'PipelineRun Status shows the % of PipelineRuns for various status like "Succeeded", "Failed", "Running", "Cancelled" and "Others". Here, Others includes statuses like "Started", "CreateRunFailed", "PipelineRunTimeout"',
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
        <CardBody className="pf-v6-u-pt-0 pf-v6-u-pb-sm">
          {pipelineRunsStatusError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load PipelineRun status')}
              className="pf-v6-u-mb-md"
            />
          ) : (
            <Grid className="pf-v6-u-align-items-center">
              <GridItem xl2={4} xl={12} lg={12} md={12} sm={12}>
                {loaded ? (
                  <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
                    <ChartDonut
                      constrainToVisibleArea={true}
                      data={donutData}
                      labels={({ datum }) => `${datum.x}: ${datum.y}%`}
                      legendData={legendData}
                      colorScale={colorScale}
                      legendOrientation="vertical"
                      legendPosition="right"
                      height={200}
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
                      title={`${data?.summary?.[0]?.succeeded ?? 0}/${
                        data?.summary?.[0]?.total ?? 0
                      }`}
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
                ) : (
                  <LoadingInline />
                )}
              </GridItem>
              <GridItem xl2={8} xl={12} lg={12} md={12} sm={12}>
                <div className="pf-v6-u-display-flex pf-v6-u-align-items-flex-end pf-v6-u-h-100">
                  {loaded ? (
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
                        <ChartLine data={chartDataSucceeded} />
                        <ChartLine data={chartDataFailed} />
                        <ChartLine data={chartDataCancelled} />
                        <ChartLine data={chartDataOthers} />
                      </ChartGroup>
                    </Chart>
                  ) : (
                    <LoadingInline />
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

export default PipelinesRunsStatusCard;
