import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import PipelineResourceStatus from './PipelineResourceStatus';
import StatusPopoverContent from './StatusPopoverContent';
import { LoadingInline } from '../../Loading';
import { getPLRLogSnippet } from '../../logs/pipelineRunLogSnippet';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { useMultiClusterProxyService } from '../../hooks/useMultiClusterProxyService';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRunKind;
  title?: string;
  taskRuns: TaskRunKind[];
  taskRunsLoaded: boolean;
};
const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({
  status,
  pipelineRun,
  title,
  taskRuns,
  taskRunsLoaded,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isResourceManagedByKueue } = useMultiClusterProxyService({ managedBy: pipelineRun?.spec?.managedBy });
  const logPath = `/k8s/ns/${
    pipelineRun?.metadata.namespace
  }/${getReferenceForModel(PipelineRunModel)}/${
    pipelineRun?.metadata.name
  }/logs`;
  return pipelineRun ? (
    taskRunsLoaded ? (
      <PipelineResourceStatus status={status} title={title}>
        <StatusPopoverContent
          logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
          namespace={pipelineRun?.metadata.namespace}
          link={<Link to={logPath}>{t('View logs')}</Link>}
          isResourceManagedByKueue={isResourceManagedByKueue}
          pipelineRunName={pipelineRun?.metadata.name}
        />
      </PipelineResourceStatus>
    ) : (
      <LoadingInline />
    )
  ) : (
    <>{'-'}</>
  );
};

export default PipelineRunStatus;
