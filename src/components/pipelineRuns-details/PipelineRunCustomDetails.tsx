import * as React from 'react';
import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import { getReferenceForModel } from '../pipelines-overview/utils';
import Status from '../status/Status';
import { ExternalLink } from '../utils/link';
import { TaskRunModel } from '../../models';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { ComputedStatus, PipelineRunKind } from '../../types';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import {
  getImageUrl,
  getSbomLink,
  getSbomTaskRun,
  hasExternalLink,
  pipelineRunDuration,
} from '../utils/pipeline-utils';
import { convertBackingPipelineToPipelineResourceRefProps } from './utils';
import RepositoryLinkList from './RepositoryLinkList';
import PipelineRunVulnerabilities from '../pipelines-list/status/PipelineRunVulnerabilities';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';
import TriggeredBySection from './TriggeredBySection';
import PipelineResourceRef from '../triggers-details/PipelineResourceRef';
import WorkspaceResourceLinkList from '../workspaces/WorkspaceResourceLinkList';

export type PipelineRunCustomDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunCustomDetails: React.FC<PipelineRunCustomDetailsProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isResourceManagedByKueue } = useMultiClusterProxyService({ managedBy: pipelineRun?.spec?.managedBy });
  const plrStatus = pipelineRunFilterReducer(pipelineRun);
  const pipelineRunFinished =
    plrStatus !== ComputedStatus.Running &&
    plrStatus !== ComputedStatus.Pending &&
    plrStatus !== ComputedStatus.Cancelling;
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
    { 
      pipelineRunFinished,
      pipelineRunManagedBy: pipelineRun?.spec?.managedBy
    },
  );

  const sbomTaskRun = taskRunsLoaded ? getSbomTaskRun(taskRuns) : null;
  const buildImage = getImageUrl(pipelineRun);
  const linkToSbom = getSbomLink(sbomTaskRun);
  const isExternalLink = hasExternalLink(sbomTaskRun);
  return (
    <>
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Status
              status={pipelineRunFilterReducer(pipelineRun)}
              title={pipelineRunTitleFilterReducer(pipelineRun)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        {taskRunsLoaded && (
          <RunDetailsErrorLog
            logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
            namespace={pipelineRun.metadata.namespace}
            isResourceManagedByKueue={isResourceManagedByKueue}
            pipelineRunName={pipelineRun.metadata.name}
          />
        )}
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Vulnerabilities')}</DescriptionListTerm>
          <DescriptionListDescription>
            <PipelineRunVulnerabilities pipelineRun={pipelineRun} />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Pipeline')}</DescriptionListTerm>
          <DescriptionListDescription>
            <PipelineResourceRef
              {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        {buildImage && sbomTaskRun && (
          <DescriptionListGroup>
            <DescriptionListTerm data-test="download-sbom">
              {t('Download SBOM')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                isReadOnly
                hoverTip={t('Copy')}
                clickTip={t('Copied')}
              >
                {`cosign download sbom ${buildImage}`}
              </ClipboardCopy>
              <ExternalLink href="https://docs.sigstore.dev/cosign/installation">
                {t('Install Cosign')}
              </ExternalLink>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {sbomTaskRun && (
          <DescriptionListGroup>
            <DescriptionListTerm data-test="view-sbom">
              {t('SBOM')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {isExternalLink &&
              linkToSbom &&
              (linkToSbom.startsWith('http://') ||
                linkToSbom.startsWith('https://')) ? (
                <ExternalLink href={linkToSbom}>{t('View SBOM')}</ExternalLink>
              ) : (
                <Link
                  to={`/k8s/ns/${
                    sbomTaskRun.metadata.namespace
                  }/${getReferenceForModel(TaskRunModel)}/${
                    sbomTaskRun.metadata.name
                  }/logs`}
                >
                  {t('View SBOM')}
                </Link>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Start time')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={pipelineRun?.status?.startTime} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Completion time')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={pipelineRun?.status?.completionTime} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Duration')}</DescriptionListTerm>
          <DescriptionListDescription>
            {pipelineRunDuration(pipelineRun)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {pipelineRun.spec?.timeouts && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Timeouts')}</DescriptionListTerm>
            <DescriptionListDescription>
              {pipelineRun.spec?.timeouts?.pipeline}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
      <TriggeredBySection pipelineRun={pipelineRun} />
      <RepositoryLinkList pipelineRun={pipelineRun} />
      <WorkspaceResourceLinkList
        workspaces={pipelineRun.spec.workspaces}
        namespace={pipelineRun.metadata.namespace}
        ownerResourceName={pipelineRun.metadata.name}
      />
    </>
  );
};

export default PipelineRunCustomDetails;
