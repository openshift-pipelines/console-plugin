import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { RepositoryModel } from '../../models';
import { PipelineRunKind } from '../../types';
import {
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
} from '../../consts';
import {
  getGroupVersionKindForModel,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { ExternalLink } from '../utils/link';
import {
  getGitProviderIcon,
  getLabelValue,
  sanitizeBranchName,
} from '../utils/repository-utils';
import { truncateMiddle } from '../utils/common-utils';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';

export type RepositoryLinkListProps = {
  pipelineRun: PipelineRunKind;
};

const RepositoryLinkList: React.FC<RepositoryLinkListProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const plrLabels = pipelineRun.metadata.labels;
  const plrAnnotations = pipelineRun.metadata.annotations;
  const repoLabel = RepositoryLabels[RepositoryFields.REPOSITORY];
  const repoName = plrLabels?.[repoLabel];
  const repoURL =
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.REPO_URL]];
  const shaURL =
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_URL]];

  if (!repoName) return null;

  return (
    <dl>
      <dt>{t('Repository')}</dt>
      <dd>
        <div>
          <ResourceIcon
            groupVersionKind={getGroupVersionKindForModel(RepositoryModel)}
          />
          <Link
            data-test="pl-repository-link"
            to={`/k8s/ns/${
              pipelineRun.metadata.namespace
            }/${getReferenceForModel(RepositoryModel)}/${repoName}/Runs`}
            className="co-resource-item__resource-name"
          >
            {repoName}
          </Link>
        </div>
        {repoURL && (
          <ExternalLink href={repoURL}>
            {getGitProviderIcon(repoURL)} {repoURL}
          </ExternalLink>
        )}
      </dd>
      {plrLabels?.[RepositoryLabels[RepositoryFields.BRANCH]] && (
        <>
          <dt>
            {t(
              getLabelValue(
                plrLabels[RepositoryLabels[RepositoryFields.BRANCH]],
              ),
            )}
          </dt>
          <dd data-test="pl-repository-branch">
            {sanitizeBranchName(
              plrLabels[RepositoryLabels[RepositoryFields.BRANCH]],
            )}
          </dd>
        </>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.SHA]] && (
        <>
          <dt>{t('Commit id')}</dt>
          <dd>
            {shaURL ? (
              <ExternalLink href={shaURL} data-test="pl-sha-url">
                {truncateMiddle(
                  plrLabels[RepositoryLabels[RepositoryFields.SHA]],
                  {
                    length: 7,
                    truncateEnd: true,
                    omission: '',
                  },
                )}
              </ExternalLink>
            ) : (
              <ClipboardCopy
                data-test="pl-commit-id"
                variant={ClipboardCopyVariant.inlineCompact}
              >
                {plrLabels[RepositoryLabels[RepositoryFields.SHA]]}
              </ClipboardCopy>
            )}
          </dd>
        </>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.EVENT_TYPE]] && (
        <>
          <dt>{t('Event type')}</dt>
          <dd data-test="pl-event-type">
            {plrLabels[RepositoryLabels[RepositoryFields.EVENT_TYPE]]}
          </dd>
        </>
      )}
    </dl>
  );
};

export default RepositoryLinkList;
