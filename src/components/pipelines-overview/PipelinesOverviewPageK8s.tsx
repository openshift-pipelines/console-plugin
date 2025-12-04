import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';
import {
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';
import NameSpaceDropdown from './NamespaceDropdown';
import TimeRangeDropdown from './TimeRangeDropdown';
import RefreshDropdown from './RefreshDropdown';
import { IntervalOptions, TimeRangeOptionsK8s, useQueryParams } from './utils';
import PipelineRunsStatusCardK8s from './PipelineRunsStatusCardK8s';
import PipelineRunsNumbersChartK8s from './PipelineRunsNumbersChartK8s';
import PipelineRunsTotalCardK8s from './PipelineRunsTotalCardK8s';
import PipelineRunsDurationCardK8s from './PipelineRunsDurationCardK8s';
import PipelineRunsListPageK8s from './list-pages/PipelineRunsListPageK8s';
import { K8sDataLimitationAlert } from './K8sDataLimitationAlert';
import { FLAGS } from '../../types';
import { ALL_NAMESPACES_KEY } from '../../consts';
import AllProjectsPage from '../projects-list/AllProjectsPage';
import './PipelinesOverview.scss';

const PipelinesOverviewPageK8s: React.FC = () => {
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
    options: TimeRangeOptionsK8s(),
    displayFormat: formatPrometheusDuration,
    loadFormat: parsePrometheusDuration,
  });

  // Remove restriction - allow all users to see "All" namespaces view
  // The data will be scoped to namespaces they have access to based on their permissions

  return (
    <>
      <PageSection variant="light" isFilled className="pf-v5-u-pl-md">
        <Title headingLevel="h2">{t('Overview')}</Title>
      </PageSection>
      <div className="k8s-overview-info-alert">
        <K8sDataLimitationAlert />
      </div>
      <Flex className="project-dropdown-label__flex">
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
        <PipelineRunsStatusCardK8s
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
            <PipelineRunsDurationCardK8s
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
            <PipelineRunsTotalCardK8s
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
            <PipelineRunsNumbersChartK8s
              namespace={activeNamespace}
              timespan={timespan}
              interval={interval}
              domain={{ y: [0, 500] }}
              bordered={true}
            />
          </FlexItem>
        </Flex>
      </div>
      <div className="pipelines-metrics__background">
        <PipelineRunsListPageK8s
          namespace={activeNamespace}
          timespan={timespan}
          interval={interval}
        />
      </div>
    </>
  );
};

export default PipelinesOverviewPageK8s;
