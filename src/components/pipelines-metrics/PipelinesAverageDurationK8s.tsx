import * as React from 'react';
import _ from 'lodash';
import * as classNames from 'classnames';
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
  monthYear,
  parsePrometheusDuration,
} from '../pipelines-overview/dateTime';
import { ALL_NAMESPACES_KEY } from '../../consts';
import {
  usePipelineMetricsForAllNamespacePoll,
  usePipelineMetricsForNamespaceForPipelinePoll,
  usePipelineMetricsForNamespacePoll,
} from './hooks';
import {
  MetricsQueryPrefix,
  PipelineQuery,
  secondsToMinutesK8s,
} from './utils';
import { roundToNearestSecond } from '../pipelines-overview/utils';

interface PipelinesAverageDurationProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
  interval?: number;
  parentName?: string;
  namespace?: string;
}
type DomainType = { x?: DomainTuple; y?: DomainTuple };

const getChartData = (
  tickValues: number[] | Date[],
  data: any,
  type: string,
) => {
  const chartData = tickValues?.map((value, index) => {
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
      if (type == 'day' || type == 'week') {
        return group_date.toDateString() === new Date(value).toDateString();
      }
      if (type == 'month') {
        return group_date.getMonth() === value.getMonth();
      }
    });
    return {
      x: value,
      y: s?.avg_duration || 0,
    };
  });
  return chartData;
};

const PipelinesAverageDurationK8s: React.FC<PipelinesAverageDurationProps> = ({
  timespan,
  domain,
  bordered,
  interval,
  parentName,
  namespace,
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
  const [tickValues, type] = getXaxisValues(timespan);

  const [totalPipelineRunsCountData] =
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

  const [totalPipelineRunsDurationData] =
    parentName && namespace
      ? usePipelineMetricsForNamespaceForPipelinePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          name: parentName,
          metricsQuery:
            PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE_FOR_PIPELINE,
        })
      : namespace == ALL_NAMESPACES_KEY
      ? usePipelineMetricsForAllNamespacePoll({
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_ALL_NAMESPACE,
        })
      : usePipelineMetricsForNamespacePoll({
          namespace,
          timespan,
          delay: interval,
          queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
          metricsQuery: PipelineQuery.PIPELINERUN_DURATION_FOR_NAMESPACE,
        });

  const combinedData = totalPipelineRunsCountData?.data?.result[0]?.values?.map(
    (value1) => {
      const group_value = value1[0];
      const runs = parseInt(value1[1]);
      const value2 =
        totalPipelineRunsDurationData?.data?.result[0]?.values?.find(
          (val) =>
            roundToNearestSecond(val[0]) === roundToNearestSecond(group_value),
        );
      const duration = value2 ? parseFloat(value2[1]) : 0;

      return { group_value, runs, duration };
    },
  );

  const result = combinedData?.map(({ group_value, runs, duration }, index) => {
    if (index === 0) {
      return {
        group_value,
        avg_duration: secondsToMinutesK8s(duration / runs),
      };
    } else {
      const prevDuration = combinedData[index - 1].duration;
      const prevRuns = combinedData[index - 1].runs;
      if (duration === prevDuration && runs === prevRuns) {
        // If both runs and duration are the same as the previous, set avg_duration to 0
        return { group_value, avg_duration: 0 };
      } else if (duration < prevDuration || runs < prevRuns) {
        // Reset condition
        return {
          group_value,
          avg_duration: secondsToMinutesK8s(duration / runs),
        };
      } else {
        // Increment condition
        const incrementalDuration = duration - prevDuration;
        const incrementalRuns = runs - prevRuns;
        const avg_duration = incrementalDuration / incrementalRuns;
        return { group_value, avg_duration: secondsToMinutesK8s(avg_duration) };
      }
    }
  });

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
      chartData = getChartData(tickValues, result, 'hour');
      break;
    case 'day':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [startDate, endDate];
      chartData = getChartData(tickValues, result, 'day');
      break;
    case 'week':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      chartData = getChartData(tickValues, result, 'week');
      break;
    case 'month':
      xTickFormat = (d) => monthYear(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      chartData = getChartData(tickValues, result, 'month');
      break;
    default:
      console.log('Received wrong data');
      break;
  }
  const max = Math.max(...chartData.map((yVal) => yVal.y));
  const roundUp = (value, nearest) => {
    return Math.ceil(value / nearest) * nearest;
  };
  const nearest = max > 10 ? 10 : 5;
  const roundedMax = roundUp(max, nearest);
  domainValue.y =
    !isNaN(roundedMax) && roundedMax > 5 ? [0, roundedMax] : [0, 5];

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
          <span>{t('Average duration')}</span>
        </CardTitle>
        <CardBody className="pipeline-overview__number-of-plr-card__body">
          <div className="pipeline-overview__number-of-plr-card__bar-chart-div">
            <Chart
              containerComponent={
                <ChartVoronoiContainer
                  labels={({ datum }) => `${datum.y}m`}
                  constrainToVisibleArea
                />
              }
              scale={{ x: 'time', y: 'linear' }}
              domain={domainValue}
              domainPadding={{ x: [30, 25] }}
              height={145}
              width={400}
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
              <ChartAxis
                dependentAxis
                style={yAxisStyle}
                tickFormat={(v) => `${v}m`}
              />
              <ChartGroup>
                <ChartBar data={chartData} barWidth={18} />
              </ChartGroup>
            </Chart>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesAverageDurationK8s;
