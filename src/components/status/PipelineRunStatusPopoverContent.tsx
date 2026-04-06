import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PipelineRunModel } from '../../models';
import { ComputedStatus, PipelineRunKind } from '../../types';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';
import LogSnippetBlock from '../logs/LogSnippetBlock';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import { LoadingInline } from '../Loading';
import { pipelineRunStatus } from '../utils/pipeline-filter-reducer';
import { resourcePathFromModel } from '../utils/utils';
import './StatusPopoverContent.scss';

type StatusPopoverContentProps = {
  pipelineRun: PipelineRunKind;
};
const PipelineRunStatusPopoverContent: FC<StatusPopoverContentProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isResourceManagedByKueue } = useMultiClusterProxyService({
    managedBy: pipelineRun.spec.managedBy,
  });
  const plrStatus = pipelineRunStatus(pipelineRun);
  const pipelineRunFinished =
    plrStatus !== ComputedStatus.Running &&
    plrStatus !== ComputedStatus.Pending &&
    plrStatus !== ComputedStatus.Cancelling;
  const [PLRTaskRuns, k8sLoaded, trLoaded] = useTaskRuns(
    pipelineRun.metadata.namespace,
    pipelineRun.metadata.name,
    undefined,
    undefined,
    {
      pipelineRunFinished,
      pipelineRunManagedBy: pipelineRun?.spec?.managedBy,
    },
  );
  /* this needs decoupling */
  const taskRunsLoaded = k8sLoaded && trLoaded;
  if (!taskRunsLoaded) {
    return (
      <div style={{ minHeight: '300px' }}>
        <LoadingInline />
      </div>
    );
  }

  const logDetails = getPLRLogSnippet(pipelineRun, PLRTaskRuns);

  return (
    <div className="odc-statuspopover-content" style={{ minHeight: '300px' }}>
      <LogSnippetBlock
        logDetails={logDetails}
        namespace={pipelineRun.metadata.namespace}
        isResourceManagedByKueue={isResourceManagedByKueue}
        pipelineRunName={pipelineRun.metadata.name}
      >
        {(logSnippet: string) => (
          <>
            <pre className="co-pre">{logSnippet}</pre>
            <Link
              to={`${resourcePathFromModel(
                PipelineRunModel,
                pipelineRun.metadata.name,
                pipelineRun.metadata.namespace,
              )}/logs`}
            >
              {t('View logs')}
            </Link>
          </>
        )}
      </LogSnippetBlock>
    </div>
  );
};

export default PipelineRunStatusPopoverContent;
