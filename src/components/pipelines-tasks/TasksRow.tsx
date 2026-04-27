import type { FC } from 'react';
import {
  getGroupVersionKindForModel,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { TaskModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TaskKind } from '../../types';
import { getTaskName } from '../utils/pipeline-augment';

const TaskRow: FC<RowProps<TaskKind>> = ({ activeColumnIDs, obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          groupVersionKind={getGroupVersionKindForModel(TaskModel)}
          name={obj.metadata.name}
          displayName={getTaskName(obj)}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="namespace">
        {obj.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        ) : (
          t('None')
        )}
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="created">
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="dropdown-kebab-pf pf-v6-c-table__action"
        id=""
      >
        <LazyActionMenu context={{ [getReferenceForModel(TaskModel)]: obj }} />
      </TableData>
    </>
  );
};

export default TaskRow;
