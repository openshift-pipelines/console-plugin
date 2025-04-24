/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import {
  SummaryProps,
  getReferenceForModel,
  listPageTableColumnClasses as tableColumnClasses,
} from '../utils';
import {
  ResourceLink,
  RowProps,
  getGroupVersionKindForModel,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import { ALL_NAMESPACES_KEY } from '../../../consts';
import { PipelineModel, PipelineModelV1Beta1 } from '../../../models';

const PipelineRunsForPipelinesRow: React.FC<
  RowProps<
    SummaryProps,
    {
      hideLastRunTime?: boolean;
    }
  >
> = ({ obj, rowData: { hideLastRunTime } }) => {
  const [activeNamespace] = useActiveNamespace();
  const [namespace, name] = obj.group_value.split('/');
  const clusterVersion = (window as any).SERVER_FLAGS?.releaseVersion;
  const isV1SupportCluster =
    clusterVersion?.split('.')[0] === '4' &&
    clusterVersion?.split('.')[1] > '13';
  const pipelineReference = getReferenceForModel(
    isV1SupportCluster ? PipelineModel : PipelineModelV1Beta1,
  );
  return (
    <>
      <td className={tableColumnClasses[0]}>
        <ResourceLink
          groupVersionKind={
            isV1SupportCluster
              ? getGroupVersionKindForModel(PipelineModel)
              : getGroupVersionKindForModel(PipelineModelV1Beta1)
          }
          name={name}
          namespace={namespace}
        />
      </td>
      {activeNamespace === ALL_NAMESPACES_KEY && (
        <td className={tableColumnClasses[1]}>
          <ResourceLink kind="Namespace" name={namespace} />
        </td>
      )}
      <td className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${namespace}/${pipelineReference}/${name}/Runs`}>
          {obj.total}
        </Link>
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

export default PipelineRunsForPipelinesRow;
