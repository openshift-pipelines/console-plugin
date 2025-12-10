import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';
import PipelineRunsStatusCard from './PipelineRunsStatusCard';
import {
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import PipelinesRunsDurationCard from './PipelineRunsDurationCard';
import PipelinesRunsTotalCard from './PipelineRunsTotalCard';
import PipelinesRunsNumbersChart from './PipelineRunsNumbersChart';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';
import NameSpaceDropdown from './NamespaceDropdown';
import PipelineRunsListPage from './list-pages/PipelineRunsListPage';
import TimeRangeDropdown from './TimeRangeDropdown';
import RefreshDropdown from './RefreshDropdown';
import { IntervalOptions, TimeRangeOptions, useQueryParams } from './utils';
import { ALL_NAMESPACES_KEY } from '../../consts';
import AllProjectsPage from '../projects-list/AllProjectsPage';
import { FLAGS } from '../../types';

const PipelinesOverviewPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();
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

  if (!canListNS && activeNamespace === ALL_NAMESPACES_KEY) {
    return <AllProjectsPage pageTitle={t('Overview')} />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false} isFilled className="pf-v6-u-pl-md">
        <Title headingLevel="h2">{t('Overview')}</Title>
      </PageSection>
      <Flex className="project-dropdown-label__flex pf-v5-u-mt-md">
        <FlexItem>
          <NameSpaceDropdown
            selected={activeNamespace}
            setSelected={setActiveNamespace}
          />
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
          namespace={activeNamespace}
          interval={interval}
        />

        <Flex>
          <FlexItem
            spacer={{ default: 'spacerXs' }}
            grow={{ default: 'grow' }}
            className="pipelines-overview__cards"
          >
            <PipelinesRunsDurationCard
              namespace={activeNamespace}
              timespan={timespan}
              interval={interval}
              bordered={true}
            />
          </FlexItem>
          <FlexItem
            spacer={{ default: 'spacerXs' }}
            grow={{ default: 'grow' }}
            className="pipelines-overview__cards"
          >
            <PipelinesRunsTotalCard
              namespace={activeNamespace}
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
              namespace={activeNamespace}
              timespan={timespan}
              interval={interval}
              domain={{ y: [0, 500] }}
              bordered={true}
            />
          </FlexItem>
        </Flex>

        <PipelineRunsListPage
          namespace={activeNamespace}
          timespan={timespan}
          interval={interval}
          bordered
        />
      </div>
    </>
  );
};

export default PipelinesOverviewPage;
