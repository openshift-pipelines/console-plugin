import {
  ResourceLink,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { memo } from 'react';
import { ArchiveIcon } from '@patternfly/react-icons';
import { PipelineRunKind } from '../../types';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { NamespaceModel, PipelineRunModel } from '../../models';
import { Tooltip } from '@patternfly/react-core';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
  chainsSignedAnnotation,
} from '../../consts';
import SignedBadgeIcon from '../../images/SignedBadge';
import PipelineRunVulnerabilities from '../pipelines-list/status/PipelineRunVulnerabilities';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import { ExternalLink } from '../utils/link';
import { t, truncateMiddle } from '../utils/common-utils';
import { sanitizeBranchName } from '../utils/repository-utils';
import { pipelineRunDuration } from '../utils/pipeline-utils';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { tableColumnInfo } from './usePipelineRunsColumns';

type PLRStatusProps = {
  obj: PipelineRunKind;
};

const PLRStatus: FC<PLRStatusProps> = memo(({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
});

export const getPipelineRunsListDataViewRows: GetDataViewRows<
  PipelineRunKind,
  { repositoryPLRs?: boolean }
> = (data, columns) => {
  return data.map(({ obj, rowData: { repositoryPLRs } }) => {
    const plrLabels = obj.metadata.labels;
    const plrAnnotations = obj.metadata.annotations;
    const branchName =
      plrLabels?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]] ||
      plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]];

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLinkWithIcon
            groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
            data-test-id={obj.metadata.name}
            model={PipelineRunModel}
            nameSuffix={
              <>
                {obj?.metadata?.annotations?.[chainsSignedAnnotation] ===
                'true' ? (
                  <Tooltip content={t('Signed')}>
                    <div className="opp-pipeline-run-list__signed-indicator">
                      <SignedBadgeIcon />
                    </div>
                  </Tooltip>
                ) : null}
                {obj?.metadata?.annotations?.[
                  DELETED_RESOURCE_IN_K8S_ANNOTATION
                ] === 'true' ||
                obj?.metadata?.annotations?.[
                  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
                ] === 'true' ? (
                  <Tooltip content={t('Archived in Tekton results')}>
                    <div className="opp-pipeline-run-list__results-indicator">
                      <ArchiveIcon />
                    </div>
                  </Tooltip>
                ) : null}
              </>
            }
          />
        ),
        props: { ...getNameCellProps('pipelineruns-list'), modifier: 'nowrap' },
      },
      [tableColumnInfo[1].id]: {
        cell: repositoryPLRs && (
          <Tooltip
            data-test="tooltip-msg"
            content={
              <>
                {plrAnnotations?.[
                  RepositoryAnnotations[RepoAnnotationFields.SHA_MESSAGE]
                ] ?? plrLabels?.[RepositoryLabels[RepositoryFields.SHA]]}
              </>
            }
          >
            <ExternalLink
              href={
                plrAnnotations?.[
                  RepositoryAnnotations[RepoAnnotationFields.SHA_URL]
                ]
              }
            >
              {truncateMiddle(
                plrLabels[RepositoryLabels[RepositoryFields.SHA]],
                {
                  length: 7,
                  truncateEnd: true,
                  omission: '',
                },
              )}
            </ExternalLink>
          </Tooltip>
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={obj.metadata.namespace}
          />
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[3].id]: {
        cell: <PipelineRunVulnerabilities pipelineRun={obj} condensed />,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[4].id]: {
        cell: <PLRStatus obj={obj} />,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[5].id]: {
        cell: <LinkedPipelineRunTaskStatus pipelineRun={obj} />,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[6].id]: {
        cell: <Timestamp timestamp={obj.status && obj.status.startTime} />,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[7].id]: {
        cell: pipelineRunDuration(obj),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[8].id]: {
        cell: repositoryPLRs && sanitizeBranchName(branchName),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[9].id]: {
        cell: (
          <LazyActionMenu
            context={{ [getReferenceForModel(PipelineRunModel)]: obj }}
          />
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
