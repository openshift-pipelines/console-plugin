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
        <PipelineRunsListPage
          namespace={namespace}
          timespan={timespan}
          interval={interval}
        />
      </div>
    </>
  );
};

export default PipelinesOverviewPage;
