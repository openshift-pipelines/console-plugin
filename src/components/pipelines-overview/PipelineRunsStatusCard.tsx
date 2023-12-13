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
  ChartDonut,
  ChartGroup,
  ChartLabel,
  ChartLegend,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Popover,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { chart_color_black_200 as othersColor } from '@patternfly/react-tokens/dist/js/chart_color_black_200';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import {
  formatDate,
  getDropDownDate,
  getXaxisValues,
  parsePrometheusDuration,
} from './dateTime';
import { useInterval } from './utils';
import { SummaryResponse, getResultsSummary } from '../utils/summary-api';
import { DataType } from '../utils/tekton-results';
import './PipelinesOverview.scss';
import { LoadingInline } from '../Loading';
import { ALL_NAMESPACES_KEY } from '../../consts';

interface PipelinesRunsStatusCardProps {
  timespan?: number;
  domain?: DomainPropType;
  bordered?: boolean;
  namespace: string;
  interval: number;
}

type DomainType = { x?: DomainTuple; y?: DomainTuple };

const PipelinesRunsStatusCard: React.FC<PipelinesRunsStatusCardProps> = ({
  timespan,
  domain,
  bordered,
  namespace,
  interval,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [data, setData] = React.useState<SummaryResponse>();
  const [data2, setData2] = React.useState<SummaryResponse>();
  const [loaded, setLoaded] = React.useState(false);
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

  const getSummaryData = (summary, setData, groupBy?) => {
    const summaryOpt = {
      summary,
      filter: `data.status.startTime>timestamp("${date}")`,
      data_type: DataType.PipelineRun,
    };
    groupBy && (summaryOpt['groupBy'] = groupBy);

    getResultsSummary(namespace, summaryOpt)
      .then((d) => {
        setLoaded(true);
        setData(d);
      })
      .catch((e) => {
        throw e;
      });
  };

  useInterval(
    () =>
      getSummaryData(
        'succeeded,cancelled,failed,others,running,total',
        setData,
      ),
    interval,
    namespace,
    date,
  );

  useInterval(
    () => getSummaryData('succeeded,total', setData2, 'day'),
    interval,
    namespace,
    date,
  );

  React.useEffect(() => {
    setLoaded(false);
  }, [namespace, timespan]);

  const tickValues = getXaxisValues(timespan);

  const chartData = tickValues?.map((value) => {
    const s = data2?.summary.find((d) => {
      return (
        new Date(d.group_value * 1000).toDateString() ===
        new Date(value).toDateString()
      );
    });
    return {
      x: value,
      y: Math.round((100 * s?.succeeded) / s?.total) || 0,
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
    tickLabels: { fill: 'var(--pf-global--Color--100)' },
  };
  const yAxisStyle: ChartAxisProps['style'] = {
    tickLabels: { fill: 'var(--pf-global--Color--100)' },
  };
  if (tickValues?.length > 7) {
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

  const colorScale = [
    successColor.value,
    failureColor.value,
    runningColor.value,
    cancelledColor.value,
    othersColor.value,
  ];

  const donutData = [
    {
      x: t('Succeeded'),
      y: Math.round(
        (100 * data?.summary[0].succeeded) / data?.summary[0].total,
      ),
    },
    {
      x: t('Failed'),
      y: Math.round((100 * data?.summary[0].failed) / data?.summary[0].total),
    },
    {
      x: t('Running'),
      y: Math.round((100 * data?.summary[0].running) / data?.summary[0].total),
    },
    {
      x: t('Cancelled'),
      y: Math.round(
        (100 * data?.summary[0].cancelled) / data?.summary[0].total,
      ),
    },
    {
      x: t('Others'),
      y: Math.round((100 * data?.summary[0].others) / data?.summary[0].total),
    },
  ];

  const legendData = donutData.map((data) => {
    return {
      name: `${data.x}: ${data.y}%`,
    };
  });
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
                    'Success Rate measures the rate at which PipelineRuns succeed compared to failed runs. The trending shown is based on the time range selected. This metric does not show runs that are running or pending.',
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
          <Grid>
            <GridItem xl2={6} xl={12} lg={12} md={12} sm={12}>
              <div className="pipeline-overview__pipelinerun-status-card__donut-chart-div">
                {loaded ? (
                  <ChartDonut
                    constrainToVisibleArea={true}
                    data={donutData}
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
                            fill: 'var(--pf-global--Color--100)',
                            fontSize: 14,
                          },
                        }}
                      />
                    }
                    subTitle={t('Succeeded')}
                    subTitleComponent={
                      <ChartLabel
                        style={{
                          fill: 'var(--pf-global--Color--400)',
                          fontSize: 14,
                        }}
                      />
                    }
                    title={`${data?.summary[0].succeeded}/${data?.summary[0].total}`}
                    titleComponent={
                      <ChartLabel
                        style={{
                          fill: 'var(--pf-global--Color--100)',
                          fontSize: 24,
                        }}
                      />
                    }
                    width={350}
                  />
                ) : (
                  <LoadingInline />
                )}
              </div>
            </GridItem>
            <GridItem xl2={5} xl={12} lg={12} md={12} sm={12}>
              <div className="pipeline-overview__pipelinerun-status-card__bar-chart-div">
              {loaded ? 
              <Chart
                  containerComponent={
                    <ChartVoronoiContainer
                      labels={({ datum }) => `${t('Succeeded')}: ${datum.y}%`}
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
                    left: 50,
                  }}
                  width={600}
                  themeColor={ChartThemeColor.blue}
                >
                  <ChartAxis
                    tickValues={tickValues}
                    style={xAxisStyle}
                    tickFormat={xTickFormat}
                  />
                  <ChartAxis
                    dependentAxis
                    tickFormat={(v) => `${v}%`}
                    style={yAxisStyle}
                  />
                  <ChartGroup>
                    <ChartBar data={chartData} barWidth={20} />
                  </ChartGroup>
                </Chart> : (
                  <LoadingInline />
                )}
              </div>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </>
  );
};

export default PipelinesRunsStatusCard;