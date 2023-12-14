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
  getXaxisValues,
  parsePrometheusDuration,
} from '../pipelines-overview/dateTime';

interface PipelinesAverageDurationProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
}
type DomainType = { x?: DomainTuple; y?: DomainTuple };

const PipelinesAverageDuration: React.FC<PipelinesAverageDurationProps> = ({
  timespan,
  domain,
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
  const tickValues = getXaxisValues(timespan);

  const chartData = tickValues.map((value) => {
    return { x: value, y: 100 };
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
                  labels={({ datum }) => `${datum.y}`}
                  constrainToVisibleArea
                />
              }
              scale={{ x: 'time', y: 'linear' }}
              domain={domainValue}
              domainPadding={{ x: [30, 25], y: [30, 25] }}
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
              <ChartAxis dependentAxis style={yAxisStyle} />
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
