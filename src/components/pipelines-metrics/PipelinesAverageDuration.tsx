import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import _ from 'lodash';
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
} from '@patternfly/react-charts/victory';
import { Card, CardBody, CardTitle, Alert } from '@patternfly/react-core';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { Loading } from '../Loading';
import {
  formatDate,
  getDropDownDate,
  getXaxisValues,
  hourformat,
  monthYear,
  parsePrometheusDuration,
  timeToMinutes,
} from '../pipelines-overview/dateTime';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { getResultsSummary } from '../utils/summary-api';
import { getFilter, useInterval } from '../pipelines-overview/utils';
import { DataType, FLAGS, SummaryResponse } from '../../types';

interface PipelinesAverageDurationProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
  interval?: number;
  parentName?: string;
  kind?: string;
  namespace?: string;
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
      y: timeToMinutes(s?.avg_duration) || 0,
    };
  });
  return chartData;
};

const BOTTOM_PAD_DEFAULT = 35;
const BOTTOM_PAD_ROTATED = 55;
const BOTTOM_PAD_LABEL = 15;
const CHART_BODY_TOP_OFFSET = 10;
const CHART_BODY_MIN_HEIGHT = 50;
const CHART_BODY_MAX_HEIGHT = 100;
const CHART_ASPECT_RATIO = 5;

const PipelinesAverageDuration: FC<PipelinesAverageDurationProps> = ({
  timespan,
  domain,
  bordered,
  interval,
  parentName,
  namespace,
  kind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [data, setData] = useState<SummaryResponse>();
  const [loaded, setLoaded] = useState(false);
  const [pipelineAverageDurationError, setPipelineAverageDurationError] =
    useState<string | undefined>();
  const abortControllerRef = useRef<AbortController>();
  const startTimespan = timespan - parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const startDate = new Date(Date.now() - startTimespan).setHours(0, 0, 0, 0);
  const { x: domainX, y: domainY } = (domain as DomainType) || {};
  const domainValue: DomainPropType = {
    x: domainX || [startDate, endDate],
    y: domainY || undefined,
  };
  const [chartWidth, setChartWidth] = useState(0);
  const chartContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setChartWidth(node.clientWidth);
    }
  }, []);

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
    setPipelineAverageDurationError(undefined);
    setData(undefined);
  }, [namespace, timespan]);

  const [tickValues, type] = getXaxisValues(timespan);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = (group_by: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setData(undefined);
    setPipelineAverageDurationError(undefined);
    setLoaded(false);

    const summaryOpt = {
      summary: 'avg_duration',
      data_type: DataType.PipelineRun,
      filter: getFilter(date, parentName, kind),
      groupBy: group_by,
    };

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
        setPipelineAverageDurationError(undefined);
        setData(d);
      })
      .catch((e) => {
        if (e.name === 'AbortError') {
          return;
        }
        setLoaded(true);
        setPipelineAverageDurationError(
          e.message || t('Failed to load average duration data'),
        );
        setData(undefined);
      });
  };

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
    tickLabels: {
      fill: 'var(--pf-t--global--text--color--regular)',
      fontSize: 12,
    },
  };
  const yAxisStyle: ChartAxisProps['style'] = {
    tickLabels: {
      fill: 'var(--pf-t--global--text--color--regular)',
      fontSize: 12,
    },
  };
  let bottomPad: number;
  if (tickValues.length > 7) {
    xAxisStyle = {
      tickLabels: {
        fill: 'var(--pf-t--global--text--color--regular)',
        angle: 320,
        fontSize: 10,
        textAnchor: 'end',
        verticalAnchor: 'end',
      },
    };
    bottomPad = BOTTOM_PAD_ROTATED;
  } else {
    bottomPad = BOTTOM_PAD_DEFAULT;
  }
  if (showLabel) bottomPad += BOTTOM_PAD_LABEL;
  const chartBodyHeight = Math.max(
    CHART_BODY_MIN_HEIGHT,
    Math.min(
      CHART_BODY_MAX_HEIGHT,
      Math.round(chartWidth / CHART_ASPECT_RATIO),
    ),
  );
  const chartHeight = CHART_BODY_TOP_OFFSET + chartBodyHeight + bottomPad;

  return (
    <>
      <Card
        className={classNames(
          'pipeline-overview__min-width-full pipeline-overview__overflow-hidden pf-v6-u-display-flex pf-v6-u-flex-direction-column',
          {
            'pipeline-overview__number-of-plr-card':
              !pipelineAverageDurationError,
            'card-border': bordered,
            'pf-v6-u-h-100': !pipelineAverageDurationError,
          },
        )}
      >
        <CardTitle className="pipeline-overview__number-of-plr-card__title">
          <span>{t('Average duration')}</span>
        </CardTitle>
        <CardBody
          className={classNames({
            'pf-v6-u-flex-1 pipeline-overview__min-height-0 pf-v6-u-display-flex pf-v6-u-flex-direction-column pf-v6-u-justify-content-flex-end pf-v6-u-align-items-flex-start pf-v6-u-p-0':
              !pipelineAverageDurationError,
          })}
        >
          {pipelineAverageDurationError ? (
            <Alert
              variant="danger"
              isInline
              title={t('Unable to load average duration')}
              className="pf-v6-u-mb-md pf-v6-u-mt-lg"
            />
          ) : (
            <div
              ref={chartContainerRef}
              className={`pf-v6-u-w-100 ${
                chartWidth > 0 ? 'pf-v6-u-h-100' : ''
              }`}
            >
              {loaded ? (
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
                  height={chartHeight}
                  width={chartWidth}
                  padding={{
                    top: 10,
                    bottom: bottomPad,
                    left: 50,
                    right: 50,
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
              ) : (
                <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-justify-content-center pf-v6-u-h-100 pf-v6-u-p-md pf-v6-u-p-0-on-md">
                  <Loading isInline={true} />
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesAverageDuration;
