import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import PipelineRunsStatusCard from '../pipelines-overview/PipelineRunsStatusCard';
import { Alert, Flex, FlexItem } from '@patternfly/react-core';
import PipelinesRunsDurationCard from '../pipelines-overview/PipelineRunsDurationCard';
import PipelinesRunsNumbersChart from '../pipelines-overview/PipelineRunsNumbersChart';
import { parsePrometheusDuration } from '../pipelines-overview/dateTime';
import TimeRangeDropdown from '../pipelines-overview/TimeRangeDropdown';
import RefreshDropdown from '../pipelines-overview/RefreshDropdown';
import PipelinesAverageDuration from './PipelinesAverageDuration';
import './PipelinesMetrics.scss';

const PipelinesMetricsPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const params = useParams();
  const { ns: namespace, name: parentName } = params;
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1w'));
  const [interval, setInterval] = React.useState(
    parsePrometheusDuration('30s'),
  );

  const sampleData = {
    summary: {
      total: 120,
      'avg-duration': '544m',
      success: 76,
      failed: 24,
      pending: 3,
      running: 3,
      cancelled: 14,
      'max-duration': '2m 8s',
      'total-duration': '1h 23m',
      'runs-in-pipelines': 4535,
      'runs-in-repositories': 2342,
      'last-runtime': '7 min ago',
      'success-rate': 100,
    },
  };

  return (
    <>
      <Alert
        className="pipeline-metrics__alert"
        isInline
        variant="info"
        title={t(
          'Pipeline metrics configuration defaults to pipelines and task level',
        )}
      >
        <p>
          {t(
            'Administrators can try this quick start to configure their metrics level to pipelinerun and taskrun. The pipelinerun and taskrun metrics level collects large volume of metrics over time in unbounded cardinality which may lead to metrics unreliability.',
          )}
        </p>
      </Alert>
      <Flex className="project-dropdown-label__flex">
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
          summaryData={sampleData.summary}
          bordered={false}
          namespace={namespace}
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
              domain={{ y: [0, 500] }}
            />
          </FlexItem>
          <FlexItem
            className="pipelines-metrics__cards"
            grow={{ default: 'grow' }}
          >
            <PipelinesAverageDuration
              timespan={timespan}
              domain={{ y: [0, 500] }}
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
            />
          </FlexItem>
        </Flex>
      </div>
    </>
  );
};

export default PipelinesMetricsPage;
