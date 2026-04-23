import type { FC } from 'react';
import { useState } from 'react';
import { Flex, FlexItem, Grid, GridItem } from '@patternfly/react-core';
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
import PipelineRunsStatusCardK8s from '../pipelines-overview/PipelineRunsStatusCardK8s';
import PipelineRunsNumbersChartK8s from '../pipelines-overview/PipelineRunsNumbersChartK8s';
import PipelineRunsDurationCardK8s from '../pipelines-overview/PipelineRunsDurationCardK8s';
import PipelinesAverageDurationK8s from './PipelinesAverageDurationK8s';
import { K8sDataLimitationAlert } from '../pipelines-overview/K8sDataLimitationAlert';

type PipelinesMetricsPageProps = {
  obj: PipelineKind;
};

const PipelinesMetricsPageK8s: FC<PipelinesMetricsPageProps> = ({ obj }) => {
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
    options: TimeRangeOptionsK8s(),
    displayFormat: formatPrometheusDuration,
    loadFormat: parsePrometheusDuration,
  });

  return (
    <>
      <div className="pf-v6-u-mt-md pf-v6-u-mx-md">
        <K8sDataLimitationAlert />
      </div>
      <Flex className="pf-v6-u-mt-md pf-v6-u-ml-md">
        <FlexItem>
          <TimeRangeDropdown timespan={timespan} setTimespan={setTimespan} />
        </FlexItem>
        <FlexItem>
          <RefreshDropdown interval={interval} setInterval={setInterval} />
        </FlexItem>
      </Flex>

      <div className="pf-v6-u-p-md">
        <PipelineRunsStatusCardK8s
          timespan={timespan}
          domain={{ y: [0, 100] }}
          bordered={false}
          namespace={namespace}
          parentName={parentName}
          interval={interval}
        />

        <Grid hasGutter className="pf-v6-u-mt-md">
          <GridItem
            span={12}
            md={6}
            lg={4}
            className="pf-v6-u-display-flex pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelineRunsNumbersChartK8s
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
              domain={{ y: [0, 500] }}
            />
          </GridItem>
          <GridItem
            span={12}
            md={6}
            lg={4}
            className="pf-v6-u-display-flex pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelinesAverageDurationK8s
              timespan={timespan}
              domain={{ y: [0, 5] }}
              namespace={namespace}
              parentName={parentName}
              interval={interval}
            />
          </GridItem>
          <GridItem
            span={12}
            md={12}
            lg={4}
            className="pf-v6-u-display-flex pf-v6-u-min-width pf-v6-u-w-100"
          >
            <PipelineRunsDurationCardK8s
              namespace={namespace}
              parentName={parentName}
              timespan={timespan}
              interval={interval}
            />
          </GridItem>
        </Grid>
      </div>
    </>
  );
};

export default PipelinesMetricsPageK8s;
