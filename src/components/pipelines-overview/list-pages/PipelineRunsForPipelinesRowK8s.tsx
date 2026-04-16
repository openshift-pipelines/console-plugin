/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router';
import { Tooltip } from '@patternfly/react-core';
import {
  ResourceIcon,
  ResourceLink,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import type { ReactNode } from 'react';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import { SummaryProps, getReferenceForModel } from '../utils';

type RowCell = { cell: ReactNode; props?: Record<string, unknown> };
import {
  NamespaceModel,
  PipelineModel,
  PipelineModelV1Beta1,
  ProjectModel,
} from '../../../models';
import { Project } from '../../../types';
import { t } from '../../utils/common-utils';

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
  }
> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const [namespace, name] = obj.group_value.split('/');
    const isV1SupportCluster = getClusterVersion();
    const pipelineReference = getReferenceForModel(
      isV1SupportCluster ? PipelineModel : PipelineModelV1Beta1,
    );
    const projectReference = getReferenceForModel(ProjectModel);

    const isNamespaceExists = (namespaceName: string) => {
      if (!rowData?.projectsLoaded) return false;
      return rowData?.projects?.some(
        (project) => project?.metadata?.name === namespaceName,
      );
    };

    const nsExists = isNamespaceExists(namespace);

    const rowCells: Record<string, RowCell> = {
      [tableColumnInfo[0].id]: {
        cell: nsExists ? (
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
          <Tooltip content={t('Resource is deleted.')}>
            <span>
              <ResourceIcon kind={pipelineReference} />
              {name}
            </span>
          </Tooltip>
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
          <Tooltip content={t('Resource is deleted.')}>
            <span>
              <ResourceIcon kind={projectReference} />
              {namespace}
            </span>
          </Tooltip>
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: nsExists ? (
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
