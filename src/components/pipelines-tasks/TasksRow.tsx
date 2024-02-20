import * as React from 'react';
import {
  K8sResourceCommon,
  ResourceLink,
  RowProps,
  TableData,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { TaskModel } from '../../models';
import { useTranslation } from 'react-i18next';
import CommonActionsDropdown from './CommonActionsDropdown';

const TaskRow: React.FC<RowProps<K8sResourceCommon>> = ({
  activeColumnIDs,
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        <ResourceLink
          kind={getReferenceForModel(TaskModel)}
          name={obj.metadata.name}
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
        className="dropdown-kebab-pf pf-v5-c-table__action"
        id=""
      >
        <CommonActionsDropdown isKebabToggle resource={obj} model={TaskModel} />
      </TableData>
    </>
  );
};

export default TaskRow;
