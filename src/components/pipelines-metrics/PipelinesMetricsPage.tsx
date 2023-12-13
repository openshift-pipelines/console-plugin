import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import PipelineRunsStatusCard from '../pipelines-overview/PipelineRunsStatusCard';
import { Flex, FlexItem } from '@patternfly/react-core';
import PipelinesRunsDurationCard from '../pipelines-overview/PipelineRunsDurationCard';
import PipelinesRunsNumbersChart from '../pipelines-overview/PipelineRunsNumbersChart';
import { parsePrometheusDuration } from '../pipelines-overview/dateTime';
import TimeRangeDropdown from '../pipelines-overview/TimeRangeDropdown';
import RefreshDropdown from '../pipelines-overview/RefreshDropdown';
import PipelinesAverageDuration from './PipelinesAverageDuration';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import './PipelinesMetrics.scss';

type PipelinesMetricsPageProps = {
  obj: K8sResourceKind;
};

const PipelinesMetricsPage: React.FC<PipelinesMetricsPageProps> = ({ obj }) => {
  const params = useParams();
  const { ns: namespace, name: parentName } = params;
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1w'));
  const [interval, setInterval] = React.useState(
    parsePrometheusDuration('30s'),
  );

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
