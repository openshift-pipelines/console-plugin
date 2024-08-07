/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@patternfly/react-core';
import {
  SummaryProps,
  getReferenceForModel,
  listPageTableColumnClasses as tableColumnClasses,
} from '../utils';
import {
  ResourceIcon,
  ResourceLink,
  RowProps,
  getGroupVersionKindForModel,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import { ALL_NAMESPACES_KEY } from '../../../consts';
import {
  PipelineModel,
  PipelineModelV1Beta1,
  ProjectModel,
} from '../../../models';
import { Project } from '../../../types';

const PipelineRunsForPipelinesRowK8s: React.FC<
  RowProps<
    SummaryProps,
    {
      hideLastRunTime?: boolean;
      projects: Project[];
      projectsLoaded: boolean;
    }
  >
> = ({ obj, rowData: { hideLastRunTime, projects, projectsLoaded } }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const [namespace, name] = obj.group_value.split('/');
  const clusterVersion = (window as any).SERVER_FLAGS?.releaseVersion;
  const isV1SupportCluster =
    clusterVersion?.split('.')[0] === '4' &&
    clusterVersion?.split('.')[1] > '13';
  const pipelineReference = getReferenceForModel(
    isV1SupportCluster ? PipelineModel : PipelineModelV1Beta1,
  );
  const projectReference = getReferenceForModel(ProjectModel);

  const isNamespaceExists = (namespaceName: string) => {
    if (!projectsLoaded) {
      return false;
    }
    return projects.some(
      (project) =>
        project?.metadata && project?.metadata?.name === namespaceName,
    );
  };

  return (
    <>
      <td className={tableColumnClasses[0]}>
        {isNamespaceExists(namespace) ? (
          <ResourceLink
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
        )}
      </td>
      {activeNamespace === ALL_NAMESPACES_KEY && (
        <td className={tableColumnClasses[1]}>
          {isNamespaceExists(namespace) ? (
            <ResourceLink kind="Namespace" name={namespace} />
          ) : (
            <Tooltip content={t('Resource is deleted.')}>
              <span>
                <ResourceIcon kind={projectReference} />
                {namespace}
              </span>
            </Tooltip>
          )}
        </td>
      )}
      <td className={tableColumnClasses[2]}>
        {isNamespaceExists(namespace) ? (
          <Link to={`/k8s/ns/${namespace}/${pipelineReference}/${name}/Runs`}>
            {obj.total}
          </Link>
        ) : (
          <span>{obj.total}</span>
        )}
      </td>
      <td className={tableColumnClasses[3]}>
        {formatTime(obj.total_duration)}
      </td>
      <td className={tableColumnClasses[4]}>{formatTime(obj.avg_duration)}</td>
      <td className={tableColumnClasses[5]}>{`${Math.round(
        (100 * obj.succeeded) / obj.total,
      )}%`}</td>
      {!hideLastRunTime && (
        <td className={tableColumnClasses[6]}>{`${formatTimeLastRunTime(
          obj.last_runtime,
        )}`}</td>
      )}
    </>
  );
};

export default PipelineRunsForPipelinesRowK8s;
