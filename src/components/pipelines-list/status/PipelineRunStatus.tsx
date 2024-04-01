import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import PipelineResourceStatus from './PipelineResourceStatus';
import StatusPopoverContent from './StatusPopoverContent';
import { LoadingInline } from '../../Loading';
import { getPLRLogSnippet } from '../../logs/pipelineRunLogSnippet';
import { getReferenceForModel } from '../../pipelines-overview/utils';

type PipelineRunStatusProps = {
  status: string;
  pipelineRun: PipelineRunKind;
  title?: string;
  taskRuns: TaskRunKind[];
};
const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({
  status,
  pipelineRun,
  title,
  taskRuns,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const logPath = `/k8s/ns/${
    pipelineRun.metadata.namespace
  }/${getReferenceForModel(PipelineRunModel)}/${
    pipelineRun.metadata.name
  }/logs`;
  return pipelineRun ? (
    taskRuns.length > 0 ? (
      <PipelineResourceStatus status={status} title={title}>
        <StatusPopoverContent
          logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
          namespace={pipelineRun.metadata.namespace}
          link={<Link to={logPath}>{t('View logs')}</Link>}
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
