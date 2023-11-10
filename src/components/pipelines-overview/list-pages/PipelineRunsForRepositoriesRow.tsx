import * as React from 'react';
import { ResourceLink, RowProps, useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { SummaryProps, getReferenceForModel, listPageTableColumnClasses as tableColumnClasses } from '../utils';
import { formatTime, formatTimeLastRunTime } from '../dateTime';
import { ALL_NAMESPACES_KEY } from '../../../consts';
import { RepositoryModel } from '../../../models';

const repositoryReference = getReferenceForModel(RepositoryModel);

const PipelineRunsForRepositoriesRow: React.FC<RowProps<SummaryProps>> = ({
  obj,
}) => {
  const [activeNamespace] = useActiveNamespace();
  
  return (
    <>
      <td className={tableColumnClasses[0]}>
        <ResourceLink
      kind={repositoryReference}
      name={obj?.group_value.split('/')[1]}
      namespace={obj?.group_value.split('/')[0]}
      /></td>
      {activeNamespace === ALL_NAMESPACES_KEY && 
      <td className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={obj?.group_value.split('/')[0]} />
      </td>}
      <td className={tableColumnClasses[2]}>
        {obj.total}
      </td>
      <td className={tableColumnClasses[3]}>{formatTime(obj.total_duration)}</td>
      <td className={tableColumnClasses[4]}>{formatTime(obj.avg_duration)}</td>
      <td className={tableColumnClasses[5]}>{`${Math.round((100 * obj.succeeded) / obj.total)}%`}</td>
      <td className={tableColumnClasses[6]}>{`${formatTimeLastRunTime(obj.last_runtime)}`}</td>
    </>
  );
};

export default PipelineRunsForRepositoriesRow;
