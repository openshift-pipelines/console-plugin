import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
  const branchName =
    plrLabels?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]] ||
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]];

  if (!repoName) return null;

  return (
    <DescriptionList className="pf-v6-u-mt-md">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Repository')}</DescriptionListTerm>
        <DescriptionListDescription>
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
        </DescriptionListDescription>
      </DescriptionListGroup>
      {branchName && (
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t(getLabelValue(branchName, t))}
          </DescriptionListTerm>
          <DescriptionListDescription data-test="pl-repository-branch">
            {sanitizeBranchName(branchName)}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.SHA]] && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Commit id')}</DescriptionListTerm>
          <DescriptionListDescription>
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
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {plrLabels?.[RepositoryLabels[RepositoryFields.EVENT_TYPE]] && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Event type')}</DescriptionListTerm>
          <DescriptionListDescription data-test="pl-event-type">
            {plrLabels[RepositoryLabels[RepositoryFields.EVENT_TYPE]]}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};

export default RepositoryLinkList;
