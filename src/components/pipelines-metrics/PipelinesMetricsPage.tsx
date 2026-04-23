import type { FC } from 'react';
import { useState } from 'react';
import PipelineRunsStatusCard from '../pipelines-overview/PipelineRunsStatusCard';
import { Flex, FlexItem, Grid, GridItem } from '@patternfly/react-core';
import PipelinesRunsDurationCard from '../pipelines-overview/PipelineRunsDurationCard';
import PipelinesRunsNumbersChart from '../pipelines-overview/PipelineRunsNumbersChart';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '../pipelines-overview/dateTime';
import TimeRangeDropdown from '../pipelines-overview/TimeRangeDropdown';
import RefreshDropdown from '../pipelines-overview/RefreshDropdown';
import PipelinesAverageDuration from './PipelinesAverageDuration';
import {
  IntervalOptions,
  TimeRangeOptions,
  useQueryParams,
} from '../pipelines-overview/utils';
import { PipelineKind } from '../../types';

type PipelinesMetricsPageProps = {
  obj: PipelineKind;
};

const PipelinesMetricsPage: FC<PipelinesMetricsPageProps> = ({ obj }) => {
  const {
    metadata: { namespace, name: parentName },
  } = obj;
  const [timespan, setTimespan] = useState(parsePrometheusDuration('1d'));
  const [interval, setInterval] = useState(parsePrometheusDuration('30s'));

  useQueryParams({
    key: 'refreshinterval',
    value: interval,
    setValue: setInterval,
    defaultValue: parsePrometheusDuration('30s'),
    options: { ...IntervalOptions(), off: 'OFF_KEY' },
    displayFormat: (v) => (v ? formatPrometheusDuration(v) : 'off'),
    loadFormat: (v) => (v == 'off' ? null : parsePrometheusDuration(v)),
  });

  useQueryParams({
    key: 'timerange',
    value: timespan,
    setValue: setTimespan,
    defaultValue: parsePrometheusDuration('1w'),
    options: TimeRangeOptions(),
    displayFormat: formatPrometheusDuration,
    loadFormat: parsePrometheusDuration,
  });

  return (
    <>
      <Flex className="pf-v6-u-mt-md pf-v6-u-ml-md">
        <FlexItem>
          <TimeRangeDropdown timespan={timespan} setTimespan={setTimespan} />
        </FlexItem>
        <FlexItem>
          <RefreshDropdown interval={interval} setInterval={setInterval} />
        </FlexItem>
      </Flex>

      <div className="pf-v6-u-p-md">
        <PipelineRunsStatusCard
          timespan={timespan}
          domain={{ y: [0, 100] }}
          bordered={false}
          namespace={namespace}
          parentName={parentName}
          kind={obj.kind}
          interval={interval}
        />

        <Grid hasGutter className="pf-v6-u-mt-md">
          <GridItem
            span={12}
            md={6}
            lg={4}
            className="pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelinesRunsNumbersChart
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              kind={obj.kind}
              domain={{ y: [0, 500] }}
            />
          </GridItem>
          <GridItem
            span={12}
            md={6}
            lg={4}
            className="pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelinesAverageDuration
              timespan={timespan}
              domain={{ y: [0, 5] }}
              namespace={namespace}
              parentName={parentName}
              interval={interval}
              kind={obj.kind}
            />
          </GridItem>
          <GridItem
            span={12}
            md={12}
            lg={4}
            className="pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelinesRunsDurationCard
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              kind={obj.kind}
            />
          </GridItem>
        </Grid>
      </div>
    </>
  );
};

export default PipelinesMetricsPage;
