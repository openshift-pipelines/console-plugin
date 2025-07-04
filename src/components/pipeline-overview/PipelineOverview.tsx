import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  isPipelineNotStarted,
  removePipelineNotStarted,
} from './pipeline-overview-utils';
import PipelineOverviewAlert from './PipelineOverviewAlert';
import PipelineRunItem from './PipelineRunItem';
import PipelineStartButton from './PipelineStartButton';
import TriggerLastRunButton from './TriggerLastRunButton';
import TriggersOverview from './TriggersOverview';
import { OverviewItem } from '../../types/topology-types';
import { PipelineKind, PipelineRunKind } from '../../types';
import { PipelineModel, PipelineRunModel } from '../../models';
import { resourcePath } from '../utils/resource-link';
import {
  getGroupVersionKindForModel,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { SidebarSectionHeading } from '../pipelines-tasks/tasks-details-pages/headings';

const MAX_VISIBLE = 3;

type PipelinesOverviewProps = {
  item: OverviewItem & {
    pipelines?: PipelineKind[];
    pipelineRuns?: PipelineRunKind[];
  };
};

const PipelinesOverview: React.FC<PipelinesOverviewProps> = ({
  item: {
    pipelines: [pipeline],
    pipelineRuns,
  },
}) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [showAlert, setShowAlert] = React.useState(
    isPipelineNotStarted(name, namespace),
  );

  React.useEffect(() => {
    setShowAlert(isPipelineNotStarted(name, namespace));
  }, [name, namespace]);

  return (
    <div data-test="pipeline-overview">
      <SidebarSectionHeading text={t(PipelineRunModel.labelPluralKey)}>
        {showAlert && pipelineRuns.length === 0 && (
          <PipelineOverviewAlert
            title={t('Pipeline could not be started automatically')}
            onClose={() => {
              setShowAlert(false);
              removePipelineNotStarted(name, namespace);
            }}
          />
        )}
        {pipelineRuns.length > MAX_VISIBLE && (
          <Link
            className="sidebar__section-view-all"
            to={`${resourcePath(PipelineModel, name, namespace)}/Runs`}
          >
            {t('View all {{pipelineRunsLength}}', {
              pipelineRunsLength: pipelineRuns.length,
            })}
          </Link>
        )}
      </SidebarSectionHeading>
      <ul className="list-group">
        <li className="list-group-item pipeline-overview">
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem>
              <ResourceLink
                inline
                groupVersionKind={getGroupVersionKindForModel(PipelineModel)}
                name={name}
                namespace={namespace}
              />
            </FlexItem>
            <FlexItem>
              {pipelineRuns.length === 0 ? (
                <PipelineStartButton
                  pipeline={pipeline}
                  namespace={namespace}
                />
              ) : (
                <TriggerLastRunButton
                  pipelineRuns={pipelineRuns}
                  namespace={namespace}
                />
              )}
            </FlexItem>
          </Flex>
        </li>
        {_.take(pipelineRuns, MAX_VISIBLE).map((pr) => (
          <PipelineRunItem key={pr.metadata.uid} pipelineRun={pr} />
        ))}
      </ul>
      <TriggersOverview pipeline={pipeline} />
    </div>
  );
};

export default PipelinesOverview;
