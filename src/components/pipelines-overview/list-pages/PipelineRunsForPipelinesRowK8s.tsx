/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router';
import {
  ResourceLink,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import type { ReactNode } from 'react';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import {
  SummaryProps,
  doesNamespaceExists,
  getReferenceForModel,
} from '../utils';

type RowCell = { cell: ReactNode; props?: Record<string, unknown> };
import {
  NamespaceModel,
  PipelineModel,
  PipelineModelV1Beta1,
} from '../../../models';
import { PipelineKind, Project } from '../../../types';
import { t } from '../../utils/common-utils';
import { TooltipforDeletedContent } from './PipelineRunsForPipelinesRow';

const getClusterVersion = () => {
  const clusterVersion = (window as any).SERVER_FLAGS?.releaseVersion;
  return (
    clusterVersion?.split('.')[0] === '4' &&
    clusterVersion?.split('.')[1] > '13'
  );
};

export const tableColumnInfo = [
  { id: 'pipelineName' },
  { id: 'namespace' },
  { id: 'total' },
  { id: 'totalDuration' },
  { id: 'avgDuration' },
  { id: 'successRate' },
  { id: 'lastRunTime' },
];

export const getPipelineRunsForPipelinesK8sDataViewRows: GetDataViewRows<
  SummaryProps,
  {
    hideLastRunTime?: boolean;
    projects?: Project[];
    projectsLoaded?: boolean;
    clusterPipelines?: PipelineKind[];
  }
> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const [namespace, name] = obj.group_value.split('/');
    const isV1SupportCluster = getClusterVersion();
    const pipelineReference = getReferenceForModel(
      isV1SupportCluster ? PipelineModel : PipelineModelV1Beta1,
    );

    const nsExists = doesNamespaceExists(rowData, namespace);

    const isClusterPipeline = !!rowData?.clusterPipelines?.find(
      (pipeline) =>
        pipeline.metadata.name === name &&
        pipeline.metadata.namespace === namespace,
    );

    const rowCells: Record<string, RowCell> = {
      [tableColumnInfo[0].id]: {
        cell:
          nsExists && isClusterPipeline ? (
            <ResourceLink
              /* needs to be removed when we update console-extension.json */
              groupVersionKind={
                isV1SupportCluster
                  ? getGroupVersionKindForModel(PipelineModel)
                  : getGroupVersionKindForModel(PipelineModelV1Beta1)
              }
              name={name}
              namespace={namespace}
            />
          ) : (
            <TooltipforDeletedContent
              content={
                !nsExists
                  ? t('This resource belongs to a deleted namespace')
                  : t('Pipeline Definition does not exist.')
              }
              model={PipelineModel}
              name={name}
            />
          ),
        props: {
          isStickyColumn: true,
          hasRightBorder: true,
          stickyMinWidth: '0',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: nsExists ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={namespace}
          />
        ) : (
          <TooltipforDeletedContent
            content={t('This namespace has been deleted')}
            model={NamespaceModel}
            name={namespace}
          />
        ),
      },
      [tableColumnInfo[2].id]: {
        cell:
          nsExists && isClusterPipeline ? (
            <Link to={`/k8s/ns/${namespace}/${pipelineReference}/${name}/Runs`}>
              {obj.total}
            </Link>
          ) : (
            <span>{obj.total}</span>
          ),
      },
      [tableColumnInfo[3].id]: {
        cell: formatTime(obj.total_duration),
      },
      [tableColumnInfo[4].id]: {
        cell: formatTime(obj.avg_duration),
      },
      [tableColumnInfo[5].id]: {
        cell: `${Math.round((100 * obj.succeeded) / obj.total)}%`,
      },
      [tableColumnInfo[6].id]: {
        cell: !rowData?.hideLastRunTime
          ? formatTimeLastRunTime(obj.last_runtime)
          : null,
      },
    };

    return columns.map(({ id }) => ({
      id,
      props: rowCells[id]?.props,
      cell: rowCells[id]?.cell,
    }));
  });
};
