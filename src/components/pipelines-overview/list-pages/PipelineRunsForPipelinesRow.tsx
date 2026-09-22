/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router';
import {
  ResourceIcon,
  K8sModel,
  ResourceLink,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import type { ReactNode } from 'react';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import {
  SummaryProps,
  getReferenceForModel,
  doesNamespaceExists,
} from '../utils';
import {
  PipelineModel,
  PipelineModelV1Beta1,
  NamespaceModel,
} from '../../../models';
import { PipelineKind, Project } from '../../../types';
import { Tooltip } from '@patternfly/react-core';
import { t } from '../../../components/utils/common-utils';

type RowCell = { cell: ReactNode; props?: Record<string, unknown> };

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

export const TooltipforDeletedContent = ({
  content,
  model,
  name,
}: {
  content: string;
  model: K8sModel;
  name: string | number;
}) => (
  <Tooltip content={content}>
    <span>
      <ResourceIcon groupVersionKind={getGroupVersionKindForModel(model)} />
      {name}
    </span>
  </Tooltip>
);

export const getPipelineRunsForPipelinesDataViewRows: GetDataViewRows<
  SummaryProps,
  {
    hideLastRunTime?: boolean;
    clusterPipelines: PipelineKind[];
    projects?: Project[];
    projectsLoaded?: boolean;
  }
> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const [namespace, name] = obj.group_value.split('/');
    const isV1SupportCluster = getClusterVersion();
    const pipelineReference = getReferenceForModel(
      isV1SupportCluster ? PipelineModel : PipelineModelV1Beta1,
    );
    const isClusterPipeline = !!rowData?.clusterPipelines?.find(
      (pipeline) =>
        pipeline.metadata.name === name &&
        pipeline.metadata.namespace === namespace,
    );

    const nsExists = doesNamespaceExists(rowData, namespace);

    const rowCells: Record<string, RowCell> = {
      [tableColumnInfo[0].id]: {
        cell:
          isClusterPipeline && nsExists ? (
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
          <ResourceLink kind="Namespace" name={namespace} />
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
          isClusterPipeline && nsExists ? (
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
