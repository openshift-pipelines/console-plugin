import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '../pipelines-overview/dateTime';
import TimeRangeDropdown from '../pipelines-overview/TimeRangeDropdown';
import RefreshDropdown from '../pipelines-overview/RefreshDropdown';
import {
  IntervalOptions,
  TimeRangeOptionsK8s,
  useQueryParams,
} from '../pipelines-overview/utils';
import { PipelineKind } from '../../types';
import './PipelinesMetrics.scss';
import PipelineRunsStatusCardK8s from '../pipelines-overview/PipelineRunsStatusCardK8s';
import PipelineRunsNumbersChartK8s from '../pipelines-overview/PipelineRunsNumbersChartK8s';
import PipelineRunsDurationCardK8s from '../pipelines-overview/PipelineRunsDurationCardK8s';
import PipelinesAverageDurationK8s from './PipelinesAverageDurationK8s';

type PipelinesMetricsPageProps = {
  obj: PipelineKind;
};

const PipelinesMetricsPageK8s: React.FC<PipelinesMetricsPageProps> = ({
  obj,
}) => {
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
    options: TimeRangeOptionsK8s(),
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
        <PipelineRunsStatusCardK8s
          timespan={timespan}
          domain={{ y: [0, 100] }}
          bordered={false}
          namespace={namespace}
          parentName={parentName}
          interval={interval}
        />

        <Flex>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelineRunsNumbersChartK8s
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              domain={{ y: [0, 500] }}
              width={400}
            />
          </FlexItem>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelinesAverageDurationK8s
              timespan={timespan}
              domain={{ y: [0, 5] }}
              namespace={namespace}
              parentName={parentName}
              interval={interval}
            />
          </FlexItem>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelineRunsDurationCardK8s
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
            />
          </FlexItem>
        </Flex>
      </div>
    </>
  );
};

export default PipelinesMetricsPageK8s;
