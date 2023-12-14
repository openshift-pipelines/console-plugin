import * as React from 'react';
import * as _ from 'lodash';
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
  getDropDownDate,
  getXaxisValues,
  parsePrometheusDuration,
} from './dateTime';
import { DataType } from '../utils/tekton-results';
import { SummaryResponse, getResultsSummary } from '../utils/summary-api';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { useInterval } from './utils';
import { LoadingInline } from '../Loading';

interface PipelinesRunsNumbersChartProps {
  namespace?: string;
  timespan?: number;
  interval?: number;
  domain?: DomainPropType;
  parentName?: string;
  bordered?: boolean;
}
type DomainType = { x?: DomainTuple; y?: DomainTuple };

const PipelinesRunsNumbersChart: React.FC<PipelinesRunsNumbersChartProps> = ({
  namespace,
  timespan,
  interval,
  domain,
  parentName,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
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

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }
  const tickValues = getXaxisValues(timespan);

  const date = getDropDownDate(timespan).toISOString();

  let filter = '';
  parentName
    ? (filter = `data.status.startTime>timestamp("${date}")&&data.metadata.labels['tekton.dev/pipeline']=="${parentName}"`)
    : (filter = `data.status.startTime>timestamp("${date}")`);

  const getSummaryData = () => {
    const summaryOpt = {
      summary: 'total',
      data_type: DataType.PipelineRun,
      filter,
      groupBy: 'day',
    };

    getResultsSummary(namespace, summaryOpt)
      .then((d) => {
        setLoaded(true);
        setData(d);
      })
      .catch((e) => {
        throw e;
      });
  };

  React.useEffect(() => {
    setLoaded(false);
  }, [namespace, timespan]);

  useInterval(getSummaryData, interval, namespace, date);

  const chartData = tickValues?.map((value) => {
    const s = data?.summary.find((d) => {
      return (
        new Date(d.group_value * 1000).toDateString() ===
        new Date(value).toDateString()
      );
    });
    return {
      x: value,
      y: s?.total || 0,
    };
  });

  const max = Math.max(...chartData.map((yVal) => yVal.y));
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

  const xTickFormat = (d) => formatDate(d);
  let xAxisStyle: ChartAxisProps['style'] = {
    tickLabels: { fill: 'var(--pf-global--Color--100)', fontSize: 12 },
  };
  const yAxisStyle: ChartAxisProps['style'] = {
    tickLabels: { fill: 'var(--pf-global--Color--100)', fontSize: 12 },
  };
  if (tickValues.length > 7) {
    xAxisStyle = {
      tickLabels: {
        fill: 'var(--pf-global--Color--100)',
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
                domainPadding={{ x: [30, 25], y: [30, 25] }}
                height={150}
                padding={{
                  top: 20,
                  bottom: 40,
                  left: 50,
                }}
                themeColor={ChartThemeColor.blue}
              >
                <ChartAxis
                  tickValues={tickValues}
                  style={xAxisStyle}
                  tickFormat={xTickFormat}
                />
                <ChartAxis dependentAxis style={yAxisStyle} />
                <ChartGroup>
                  <ChartBar data={chartData} barWidth={18} />
                </ChartGroup>
              </Chart>
            ) : (
              <LoadingInline />
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsNumbersChart;
