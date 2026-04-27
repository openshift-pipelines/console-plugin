import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import { getResourceModelFromBindingKind } from '../utils/pipeline-augment';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { defaultTableColumnInfo as tableColumnInfo } from './useDefaultColumns';
import { NamespaceModel } from '../../models';
import { t } from '../utils/common-utils';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';

export const getDefaultListPageDataViewRows: GetDataViewRows<
  K8sResourceCommon
> = (data, columns) => {
  return data.map(({ obj }) => {
    const model = getResourceModelFromBindingKind(obj?.kind);
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(model)}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
        props: {
          ...getNameCellProps(`${obj?.kind}-list`),
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: obj?.metadata?.namespace ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={obj.metadata.namespace}
          />
        ) : (
          t('None')
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <LazyActionMenu context={{ [getReferenceForModel(model)]: obj }} />
        ),
        props: { ...actionsCellProps },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
