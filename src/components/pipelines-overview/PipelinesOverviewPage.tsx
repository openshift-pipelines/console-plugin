import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PipelineRunsStatusCard from './PipelineRunsStatusCard';
import { Flex, FlexItem } from '@patternfly/react-core';
import PipelinesRunsDurationCard from './PipelineRunsDurationCard';
import PipelinesRunsTotalCard from './PipelineRunsTotalCard';
import PipelinesRunsNumbersChart from './PipelineRunsNumbersChart';
import { parsePrometheusDuration } from './dateTime';
import NameSpaceDropdown from './NamespaceDropdown';
import PipelineRunsListPage from './list-pages/PipelineRunsListPage';
import TimeRangeDropdown from './TimeRangeDropdown';
import RefreshDropdown from './RefreshDropdown';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';

const PipelinesOverviewPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();

  const [namespace, setNamespace] = React.useState(activeNamespace);
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1w'));
  const [interval, setInterval] = React.useState(
    parsePrometheusDuration('30s'),
  );

  React.useEffect(() => {
    setActiveNamespace(namespace);
  }, [namespace]);

  // TO-DO delete the sample data
  const sampleData = {
    summary: {
      total: 120,
      'avg-duration': '54m',
      succeeded: 76,
      failed: 24,
      completed: 3,
      unkwown: 3,
      cancelled: 14,
      'max-duration': '2m 8s',
      'total-duration': '1h 23m',
      'runs-in-pipelines': 4535,
      'runs-in-repositories': 2342,
      'last-runtime': '7 min ago',
      'success-rate': 100,
    },
  };

  const mainData = [
    {
      repoName: 'repo-1',
      pipelineName: 'pipeline-1',
      projectName: 'project-1',
      summary: sampleData.summary,
    },
    {
      repoName: 'repo-2',
      pipelineName: 'pipeline-2',
      projectName: 'project-2',
      summary: sampleData.summary,
    },
    {
      repoName: 'repo-3',
      pipelineName: 'pipeline-3',
      projectName: 'project-3',
      summary: sampleData.summary,
    },
    {
      repoName: 'repo-4',
      pipelineName: 'pipeline-4',
      projectName: 'project-4',
      summary: sampleData.summary,
    },
    {
      repoName: 'repo-5',
      pipelineName: 'pipeline-5',
      projectName: 'project-5',
      summary: sampleData.summary,
    },
    {
      repoName: 'repo-6',
      pipelineName: 'pipeline-6',
      projectName: 'project-6',
      summary: sampleData.summary,
    },
  ];

  return (
    <>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading">
          <span>{t('Overview')}</span>
        </h1>
      </div>
      <Flex className="project-dropdown-label__flex">
        <FlexItem>
          <NameSpaceDropdown selected={namespace} setSelected={setNamespace} />
        </FlexItem>
        <FlexItem>
          <TimeRangeDropdown timespan={timespan} setTimespan={setTimespan} />
        </FlexItem>
        <FlexItem>
          <RefreshDropdown interval={interval} setInterval={setInterval} />
        </FlexItem>
      </Flex>
      <div className="pipeline-overview__duration-total-plr-grid">
        <PipelineRunsStatusCard
          timespan={timespan}
          domain={{ y: [0, 100] }}
          summaryData={sampleData.summary}
          bordered={true}
          namespace={namespace}
          interval={interval}
        />

        <Flex>
          <FlexItem
            grow={{ default: 'grow' }}
            className="pipelines-overview__cards"
          >
            <PipelinesRunsDurationCard
              namespace={namespace}
              timespan={timespan}
              interval={interval}
              bordered={true}
            />
          </FlexItem>
          <FlexItem
            grow={{ default: 'grow' }}
            className="pipelines-overview__cards"
          >
            <PipelinesRunsTotalCard
              namespace={namespace}
              timespan={timespan}
              interval={interval}
              summaryData={sampleData.summary}
              bordered={true}
            />
          </FlexItem>
          <FlexItem
            grow={{ default: 'grow' }}
            className="pipelines-overview__cards"
          >
            <PipelinesRunsNumbersChart
              namespace={namespace}
              timespan={timespan}
              interval={interval}
              domain={{ y: [0, 500] }}
              bordered={true}
            />
          </FlexItem>
        </Flex>
      </div>
      <div className="pipelines-metrics__background">
        <PipelineRunsListPage mainData={mainData} />
      </div>
    </>
  );
};

export default PipelinesOverviewPage;
