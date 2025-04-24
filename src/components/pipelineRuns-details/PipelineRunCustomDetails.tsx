import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import { getReferenceForModel } from '../pipelines-overview/utils';
import Status from '../status/Status';
import { ExternalLink } from '../utils/link';
import { TaskRunModel } from '../../models';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunKind } from '../../types';
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
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );

  const sbomTaskRun = taskRunsLoaded ? getSbomTaskRun(taskRuns) : null;
  const buildImage = getImageUrl(pipelineRun);
  const linkToSbom = getSbomLink(sbomTaskRun);
  const isExternalLink = hasExternalLink(sbomTaskRun);
  return (
    <>
      <dl>
        <dt>{t('Status')}</dt>
        <dd>
          <Status
            status={pipelineRunFilterReducer(pipelineRun)}
            title={pipelineRunTitleFilterReducer(pipelineRun)}
          />
        </dd>
      </dl>
      {taskRunsLoaded && (
        <RunDetailsErrorLog
          logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
          namespace={pipelineRun.metadata.namespace}
        />
      )}
      <dl>
        <dt>{t('Vulnerabilities')}</dt>
        <dd>
          <PipelineRunVulnerabilities pipelineRun={pipelineRun} />
        </dd>
      </dl>
      <dl>
        <dt>{t('Pipeline')}</dt>
        <dd>
          <PipelineResourceRef
            {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)}
          />
        </dd>
        {buildImage && sbomTaskRun && (
          <>
            <dt data-test="download-sbom">{t('Download SBOM')}</dt>
            <dd>
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
            </dd>
          </>
        )}
        {sbomTaskRun && (
          <>
            <dt data-test="view-sbom">{t('SBOM')}</dt>
            <dd>
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
            </dd>
          </>
        )}
      </dl>

      <dl>
        <dt>{t('Start time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.startTime} />
        </dd>
        <dt>{t('Completion time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.completionTime} />
        </dd>
        <dt>{t('Duration')}</dt>
        <dd>{pipelineRunDuration(pipelineRun)}</dd>
        {pipelineRun.spec?.timeouts && (
          <>
            <dt>{t('Timeouts')}</dt>
            <dd>{pipelineRun.spec?.timeouts?.pipeline}</dd>
          </>
        )}
      </dl>
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
