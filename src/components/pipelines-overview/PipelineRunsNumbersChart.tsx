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
import { Alert, Card, CardBody, CardTitle } from '@patternfly/react-core';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  formatDate,
  getDropDownDate,
  getXaxisValues,
  hourformat,
  parsePrometheusDuration,
  monthYear,
} from './dateTime';
import { getResultsSummary } from '../utils/summary-api';
import { DataType, FLAGS, SummaryResponse } from '../../types';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { getFilter, useInterval } from './utils';
import { LoadingInline } from '../Loading';

interface PipelinesRunsNumbersChartProps {
  namespace?: string;
  timespan?: number;
  interval?: number;
  domain?: DomainPropType;
  parentName?: string;
  bordered?: boolean;
  kind?: string;
  width?: number;
}
type DomainType = { x?: DomainTuple; y?: DomainTuple };

const getChartData = (
  tickValues: number[] | Date[],
  data: SummaryResponse,
  type: string,
) => {
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
      y: s?.total || 0,
    };
  });
  return chartData;
};

const PipelinesRunsNumbersChart: React.FC<PipelinesRunsNumbersChartProps> = ({
  namespace,
  timespan,
  interval,
  domain,
  parentName,
  bordered,
  kind,
  width = 530,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const startTimespan = timespan - parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const startDate = new Date(Date.now() - startTimespan).setHours(0, 0, 0, 0);
  const { x: domainX, y: domainY } = (domain as DomainType) || {};
  const domainValue: DomainPropType = {
    x: domainX || [startDate, endDate],
    y: domainY || undefined,
  };

  const [data, setData] = React.useState<SummaryResponse>();
  const [loaded, setLoaded] = React.useState(false);
  const [pipelineRunsChartError, setPipelineRunsChartError] = React.useState<
    string | undefined
  >();
  const abortControllerRef = React.useRef<AbortController>();

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const [tickValues, type] = getXaxisValues(timespan);
  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = (group_by: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setData(undefined);

    const summaryOpt = {
      summary: 'total',
      data_type: DataType?.PipelineRun,
      filter: getFilter(date, parentName, kind),
      groupBy: group_by,
    };
    setPipelineRunsChartError(undefined);
    setLoaded(false);
    getResultsSummary(
      namespace,
      summaryOpt,
      undefined,
      isDevConsoleProxyAvailable,
      abortControllerRef.current.signal,
      90000,
    )
      .then((d) => {
        setLoaded(true);
        setPipelineRunsChartError(undefined);
        setData(d);
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          // Request was cancelled, this is expected behavior
          return;
        }
        setLoaded(true);
        setPipelineRunsChartError(
          e.message || t('Failed to load pipeline runs number data'),
        );
        setData(undefined);
      });
  };

  React.useEffect(() => {
    setLoaded(false);
    setPipelineRunsChartError(undefined);
    setData(undefined);
  }, [namespace, timespan]);

  let xTickFormat;
  let dayLabel;
  let showLabel = false;
  let chartData = [];
  switch (type) {
    case 'hour':
      xTickFormat = (d) => hourformat(d);
      showLabel = true;
      domainValue.x = [0, 23];
      useInterval(() => getSummaryData('hour'), interval, namespace, date);
      dayLabel = formatDate(new Date());
      chartData = getChartData(tickValues, data, 'hour');
      break;
    case 'day':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [startDate, endDate];
      useInterval(() => getSummaryData('day'), interval, namespace, date);
      chartData = getChartData(tickValues, data, 'day');
      break;
    case 'week':
      xTickFormat = (d) => formatDate(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      useInterval(() => getSummaryData('week'), interval, namespace, date);
      chartData = getChartData(tickValues, data, 'week');
      break;
    case 'month':
      xTickFormat = (d) => monthYear(d);
      domainValue.x = [new Date(tickValues[0]), new Date(tickValues[11])];
      useInterval(() => getSummaryData('month'), interval, namespace, date);
      chartData = getChartData(tickValues, data, 'month');
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
        className={classNames({
          'pipeline-overview__number-of-plr-card':!pipelineRunsChartError,
          'card-border': bordered,
        })}
      >
        <CardTitle className="pipeline-overview__number-of-plr-card__title">
          <span>{t('Number of PipelineRuns')}</span>
        </CardTitle>
        <CardBody 
          className={classNames({
            'pipeline-overview__number-of-plr-card__body':!pipelineRunsChartError,
          })}
          >
          {pipelineRunsChartError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load pipeline runs')}
              className="pf-v5-u-mb-md pf-v5-u-mt-lg"
            />
          ) : (
            <div className="pipeline-overview__number-of-plr-card__bar-chart-div">
              {loaded ? (
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
              ) : (
                <div className="pipeline-overview__number-of-plr-card__loading pf-v5-u-h-100">
                  <LoadingInline />
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsNumbersChart;
