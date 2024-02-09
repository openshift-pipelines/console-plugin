import * as React from 'react';
import PipelineRunsStatusCard from '../pipelines-overview/PipelineRunsStatusCard';
import { Flex, FlexItem } from '@patternfly/react-core';
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
import './PipelinesMetrics.scss';

type PipelinesMetricsPageProps = {
  obj: PipelineKind;
};

const PipelinesMetricsPage: React.FC<PipelinesMetricsPageProps> = ({ obj }) => {
  const {
    metadata: { namespace, name: parentName },
  } = obj;
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1d'));
  const [interval, setInterval] = React.useState(
    parsePrometheusDuration('30s'),
  );

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
      <Flex className="pipelines-metrix-dropdown">
        <FlexItem>
          <TimeRangeDropdown timespan={timespan} setTimespan={setTimespan} />
        </FlexItem>
        <FlexItem>
          <RefreshDropdown interval={interval} setInterval={setInterval} />
        </FlexItem>
      </Flex>

      <div className="pipelines-metrics__background">
        <PipelineRunsStatusCard
          timespan={timespan}
          domain={{ y: [0, 100] }}
          bordered={false}
          namespace={namespace}
          parentName={parentName}
          kind={obj.kind}
          interval={interval}
        />

        <Flex>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelinesRunsNumbersChart
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              kind={obj.kind}
              domain={{ y: [0, 500] }}
            />
          </FlexItem>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelinesAverageDuration
              timespan={timespan}
              domain={{ y: [0, 5] }}
              namespace={namespace}
              parentName={parentName}
              interval={interval}
              kind={obj.kind}
            />
          </FlexItem>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelinesRunsDurationCard
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              kind={obj.kind}
            />
          </FlexItem>
        </Flex>
      </div>
    </>
  );
};

export default PipelinesMetricsPage;
