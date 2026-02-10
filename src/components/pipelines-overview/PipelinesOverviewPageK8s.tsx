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
import { IntervalOptions, TimeRangeOptionsK8s } from './utils';
import PipelineRunsStatusCardK8s from './PipelineRunsStatusCardK8s';
import PipelineRunsNumbersChartK8s from './PipelineRunsNumbersChartK8s';
import PipelineRunsTotalCardK8s from './PipelineRunsTotalCardK8s';
import PipelineRunsDurationCardK8s from './PipelineRunsDurationCardK8s';
import PipelineRunsListPageK8s from './list-pages/PipelineRunsListPageK8s';
import { K8sDataLimitationAlert } from './K8sDataLimitationAlert';
import { FLAGS } from '../../types';
import { ALL_NAMESPACES_KEY } from '../../consts';
import AllProjectsPage from '../projects-list/AllProjectsPage';
import {
  usePersistedTimespanWithUrl,
  usePersistedIntervalWithUrl,
} from '../hooks/usePersistedFiltersForPipelineOverview';

const PipelinesOverviewPageK8s: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();

  const [timespan, setTimespan] = usePersistedTimespanWithUrl(
    parsePrometheusDuration('1d'),
    {
      options: TimeRangeOptionsK8s(),
      displayFormat: formatPrometheusDuration,
      loadFormat: parsePrometheusDuration,
    },
    activeNamespace,
  );

  const [interval, setInterval] = usePersistedIntervalWithUrl(
    parsePrometheusDuration('30s'),
    {
      options: { ...IntervalOptions(), off: 'OFF_KEY' },
      displayFormat: (v) => (v ? formatPrometheusDuration(v) : 'off'),
      loadFormat: (v) => (v == 'off' ? null : parsePrometheusDuration(v)),
    },
    activeNamespace,
  );

  if (!canListNS && activeNamespace === ALL_NAMESPACES_KEY) {
    return <AllProjectsPage pageTitle={t('Overview')} />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false} isFilled className="pf-v6-u-pl-md">
        <Title headingLevel="h2">{t('Overview')}</Title>
      </PageSection>
      <div className="pf-v5-u-m-md">
        <K8sDataLimitationAlert />
      </div>
      <Flex className="pf-v6-u-pl-md pf-v6-u-pr-md pf-v6-u-mb-md">
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
      <div className="pf-v6-u-pl-md pf-v6-u-pr-md">
        <PipelineRunsStatusCardK8s
          timespan={timespan}
          domain={{ y: [0, 100] }}
          bordered={true}
          namespace={activeNamespace}
          interval={interval}
        />

        <Flex
          className="pf-v6-u-mt-md"
          alignItems={{ default: 'alignItemsStretch' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem flex={{ default: 'flex_1' }}>
            <PipelineRunsDurationCardK8s
              namespace={activeNamespace}
              timespan={timespan}
              interval={interval}
              bordered={true}
            />
          </FlexItem>
          <FlexItem
            flex={{ default: 'flex_1' }}
            // spacer={{ default: 'spacerXs' }}
            // grow={{ default: 'grow' }}
            // className="pipelines-overview__cards"
          >
            <PipelineRunsTotalCardK8s
              namespace={activeNamespace}
              timespan={timespan}
              interval={interval}
              bordered={true}
            />
          </FlexItem>
          <FlexItem
            flex={{ default: 'flex_2' }}
            // grow={{ default: 'grow' }}
            // className="pipelines-overview__cards"
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
        <div className="pf-v6-u-mt-md">
          <PipelineRunsListPageK8s
            namespace={activeNamespace}
            timespan={timespan}
            interval={interval}
            bordered
          />
        </div>
      </div>
    </>
  );
};

export default PipelinesOverviewPageK8s;
