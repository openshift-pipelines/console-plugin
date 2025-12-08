import * as React from 'react';
import * as _ from 'lodash';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { DomainPropType, DomainTuple } from 'victory-core';
import {
  Chart,
  ChartAxis,
  ChartAxisProps,
  ChartBar,
  ChartGroup,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import {
  formatDate,
  getXaxisValues,
  hourformat,
  parsePrometheusDuration,
  monthYear,
} from './dateTime';
import { ALL_NAMESPACES_KEY } from '../../consts';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespaceForPipelinePoll,
  usePipelineMetricsForNamespacePoll,
} from '../pipelines-metrics/hooks';
import {
  MetricsQueryPrefix,
  PipelineQuery,
  adjustToStartOfWeek,
} from '../pipelines-metrics/utils';
import { LoadingInline } from '../Loading';

interface PipelinesRunsNumbersChartProps {
  namespace?: string;
  timespan?: number;
  interval?: number;
  domain?: DomainPropType;
  parentName?: string;
  bordered?: boolean;
  width?: number;
}
type DomainType = { x?: DomainTuple; y?: DomainTuple };

const metricsToSummary = (
  prometheusResult: any,
): { group_value: number; total: number }[] => {
  let summaryResponse = [];
  if (prometheusResult?.data?.result[0]?.values) {
    summaryResponse = prometheusResult?.data?.result[0]?.values.map(
      (value, index, array) => {
        const previousValue = index > 0 ? parseInt(array[index - 1][1]) : 0;
        const currentValue = parseInt(value[1]);
        const total = currentValue - previousValue;
        return {
          group_value: value[0],
          total: total < 0 ? currentValue : total,
        };
      },
    );
    return summaryResponse;
  }
  return summaryResponse;
};

const getChartData = (
  tickValues: number[] | Date[],
  data: any,
  type: string,
) => {
  const sortedTickValues = tickValues.slice().sort((a, b) => a - b);
  const chartData = sortedTickValues?.map((value, index) => {
    if (index === 0) {
      // Ensure the first value is always 0
      return {
        x: value,
        y: 0,
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
      y: s?.total || 0,
    };
  });
  return chartData;
};

const PipelineRunsNumbersChartK8s: React.FC<PipelinesRunsNumbersChartProps> = ({
  namespace,
  timespan,
  interval,
  domain,
  parentName,
  bordered,
  width = 530,
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

  const [runSuccessRatioData, , loadingRunSuccessRatioData] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE_FOR_PIPELINE,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_COUNT_FOR_NAMESPACE,
        });
  const convertToSummaryData = metricsToSummary(runSuccessRatioData);

  const [tickValues, type] = getXaxisValues(timespan);

  let xTickFormat;
  let dayLabel;
  let showLabel = false;
  let chartData = [];
  switch (type) {
    case 'hour':
      xTickFormat = (d) => hourformat(d);
      showLabel = true;
      domainValue.x = [0, 23];
      dayLabel = formatDate(new Date());
      chartData = getChartData(tickValues, convertToSummaryData, 'hour');
      break;
    case 'day':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [startDate, endDate];
      chartData = getChartData(tickValues, convertToSummaryData, 'day');
      break;
    case 'week':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      chartData = getChartData(tickValues, convertToSummaryData, 'week');
      break;
    case 'month':
      xTickFormat = (d) => monthYear(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      chartData = getChartData(tickValues, convertToSummaryData, 'month');
      break;
    default:
      console.log('Received wrong data');
      break;
  }
  const max: number = Math.max(...chartData.map((yVal) => yVal.y));
  !isNaN(max) && max > 5
    ? (domainValue.y = [0, max])
    : (domainValue.y = [0, 5]);

  if (!domainY) {
    let minY: number = _.minBy(chartData, 'y')?.y ?? 0;
    let maxY: number = _.maxBy(chartData, 'y')?.y ?? 0;
    if (minY === 0 && maxY === 0) {
      minY = -1;
      maxY = 1;
    } else if (minY > 0 && maxY > 0) {
      minY = 0;
    } else if (minY < 0 && maxY < 0) {
      maxY = 0;
    }
    domainValue.y = [minY, maxY];
  }

  let xAxisStyle: ChartAxisProps['style'] = {
    tickLabels: { fill: 'var(--pf-v5-global--Color--100)', fontSize: 12 },
  };
  const yAxisStyle: ChartAxisProps['style'] = {
    tickLabels: { fill: 'var(--pf-v5-global--Color--100)', fontSize: 12 },
  };
  if (tickValues.length > 7) {
    xAxisStyle = {
      tickLabels: {
        fill: 'var(--pf-v5-global--Color--100)',
        angle: 320,
        fontSize: 10,
        textAnchor: 'end',
        verticalAnchor: 'end',
      },
    };
  }

  return (
    <>
      <Card
        className={classNames('pipeline-overview__number-of-plr-card', {
          'card-border': bordered,
        })}
      >
        <CardTitle className="pipeline-overview__number-of-plr-card__title">
          <span>{t('Number of PipelineRuns')}</span>
        </CardTitle>
        <CardBody className="pipeline-overview__number-of-plr-card__body">
          <div className="pipeline-overview__number-of-plr-card__bar-chart-div">
          {loadingRunSuccessRatioData ? (
              <LoadingInline />
            ) : (
            <Chart
              containerComponent={
                <ChartVoronoiContainer
                  labels={({ datum }) => `${datum.y}`}
                  constrainToVisibleArea
                />
              }
              scale={{ x: 'time', y: 'linear' }}
              domain={domainValue}
              domainPadding={{ x: [30, 25] }}
              height={145}
              width={width}
              padding={{
                top: 10,
                bottom: 55,
                left: 50,
              }}
              themeColor={ChartThemeColor.blue}
            >
              <ChartAxis
                tickValues={tickValues}
                style={xAxisStyle}
                tickFormat={xTickFormat}
                label={showLabel ? dayLabel : ''}
              />
              <ChartAxis dependentAxis style={yAxisStyle} />
              <ChartGroup>
                <ChartBar data={chartData} barWidth={18} />
              </ChartGroup>
            </Chart>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelineRunsNumbersChartK8s;
