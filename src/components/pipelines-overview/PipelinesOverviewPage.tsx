import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { action } from 'typesafe-actions';
import PipelineRunsStatusCard from './PipelineRunsStatusCard';
import { Flex, FlexItem } from '@patternfly/react-core';
import PipelinesRunsDurationCard from './PipelineRunsDurationCard';
import PipelinesRunsTotalCard from './PipelineRunsTotalCard';
import PipelinesRunsNumbersChart from './PipelineRunsNumbersChart';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';
import NameSpaceDropdown from './NamespaceDropdown';
import PipelineRunsListPage from './list-pages/PipelineRunsListPage';
import TimeRangeDropdown from './TimeRangeDropdown';
import RefreshDropdown from './RefreshDropdown';
import {
  IntervalOptions,
  TimeRangeOptions,
  formatNamespaceRoute,
  useQueryParams,
} from './utils';

// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useActiveNamespace } from '../hooks/useActiveNamespace';

const PipelinesOverviewPage: React.FC = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const dispatch = useDispatch();
  const history = useHistory();
  const [namespace, setNamespace] = React.useState(activeNamespace);
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1d'));
  const [interval, setInterval] = React.useState(
    parsePrometheusDuration('30s'),
  );
  React.useEffect(() => {
    if (namespace !== activeNamespace) {
      dispatch(action('setActiveNamespace', { namespace }));
      const oldPath = window.location.pathname;
      const newPath = formatNamespaceRoute(namespace, oldPath, window.location);
      if (newPath !== oldPath) {
        history.push(newPath);
      }
    }
  }, [namespace]);

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
