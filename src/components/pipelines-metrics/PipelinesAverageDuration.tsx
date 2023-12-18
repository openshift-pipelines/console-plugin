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
  getDropDownDate,
  getXaxisValues,
  parsePrometheusDuration,
  timeToMinutes,
} from '../pipelines-overview/dateTime';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { DataType } from '../utils/tekton-results';
import { SummaryResponse, getResultsSummary } from '../utils/summary-api';
import { getFilter, useInterval } from '../pipelines-overview/utils';

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

const PipelinesAverageDuration: React.FC<PipelinesAverageDurationProps> = ({
  timespan,
  domain,
  bordered,
  interval,
  parentName,
  namespace,
  kind,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [data, setData] = React.useState<SummaryResponse>();
  const startTimespan = timespan - parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const startDate = new Date(Date.now() - startTimespan).setHours(0, 0, 0, 0);
  const { x: domainX, y: domainY } = (domain as DomainType) || {};
  const domainValue: DomainPropType = {
    x: domainX || [startDate, endDate],
    y: domainY || undefined,
  };

  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }

  const tickValues = getXaxisValues(timespan);

  const date = getDropDownDate(timespan).toISOString();

  const getSummaryData = () => {
    const summaryOpt = {
      summary: 'avg_duration',
      data_type: DataType.PipelineRun,
      filter: getFilter(date, parentName, kind),
      groupBy: 'day',
    };

    getResultsSummary(namespace, summaryOpt)
      .then((d) => {
        setData(d);
      })
      .catch((e) => {
        throw e;
      });
  };

  useInterval(getSummaryData, interval, namespace, date);

  const chartData = tickValues.map((value) => {
    const s = data?.summary.find((d) => {
      return (
        new Date(d.group_value * 1000).toDateString() ===
        new Date(value).toDateString()
      );
    });
    return {
      x: value,
      y: timeToMinutes(s?.avg_duration) || 0,
    };
  });

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
          <span>{t('Average Duration')}</span>
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
              domainPadding={{ x: [30, 25]}}
              height={150}
              width={400}
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

export default PipelinesAverageDuration;
