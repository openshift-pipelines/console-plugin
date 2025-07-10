import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { resourcePath } from '../utils/resource-link';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { pipelineRunStatus } from '../utils/pipeline-filter-reducer';
import Status from '../status/Status';
import LogSnippetBlock from '../logs/LogSnippetBlock';
import { fromNow } from '../pipelines-overview/dateTime';
import LogSnippet from '../logs/LogSnippet';
import './PipelineRunItem.scss';

type PipelineRunItemProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunItem: React.FC<PipelineRunItemProps> = ({ pipelineRun }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    metadata: { name, namespace, creationTimestamp },
    status,
  } = pipelineRun;
  const [taskRuns] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  const path = resourcePath(PipelineRunModel, name, namespace);
  const lastUpdated = status
    ? status.completionTime || status.startTime || creationTimestamp
    : creationTimestamp;
  const logDetails = getPLRLogSnippet(pipelineRun, taskRuns);
  return (
    <li className="opp-pipeline-run-item list-group-item">
      <Grid hasGutter>
        <GridItem span={6}>
          <div>
            <Link to={`${path}`}>{name}</Link>
            {lastUpdated && (
              <>
                {' '}
                <span className="opp-pipeline-run-item__time pf-v6-u-text-color-subtle">
                  ({fromNow(lastUpdated)})
                </span>
              </>
            )}
          </div>
        </GridItem>
        <GridItem span={3}>
          <Status status={pipelineRunStatus(pipelineRun) || 'Pending'} />
        </GridItem>
        <GridItem span={3} className="pf-v6-u-text-align-right">
          <Link to={`${path}/logs`}>{t('View logs')}</Link>
        </GridItem>
        {logDetails && (
          <GridItem>
            <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
              {(logSnippet: string) => (
                <LogSnippet
                  message={logDetails.title}
                  logSnippet={logSnippet}
                />
              )}
            </LogSnippetBlock>
          </GridItem>
        )}
      </Grid>
    </li>
  );
};

export default PipelineRunItem;
