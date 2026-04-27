import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  ResourceLink,
  RowProps,
  Timestamp,
  getGroupVersionKindForModel,
  useK8sWatchResource,
  ListPageBody,
  ListPageCreateLink,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { TaskModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getTaskName } from '../utils/pipeline-augment';
import { TaskKind } from '../../types';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

const taskModelRef = getReferenceForModel(TaskModel);

const getTaskDataViewRows = (
  data: RowProps<TaskKind>[],
  columns: { id: string }[],
) => {
  return data.map(({ obj }) => {
    const rowCells: Record<string, { cell: React.ReactNode; props?: object }> =
      {
        name: {
          cell: (
            <ResourceLink
              kind={getReferenceForModel(TaskModel)}
              name={obj.metadata.name}
              displayName={getTaskName(obj)}
              namespace={obj.metadata.namespace}
            />
          ),
          props: getNameCellProps(obj.metadata.name),
        },
        namespace: {
          cell: obj.metadata.namespace ? (
            <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
          ) : (
            '-'
          ),
        },
        created: {
          cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
        },
        actions: {
          cell: (
            <LazyActionMenu
              context={{ [getReferenceForModel(TaskModel)]: obj }}
            />
          ),
          props: actionsCellProps,
        },
      };

    return columns.map(({ id }) => ({
      id,
      props: rowCells[id]?.props,
      cell: rowCells[id]?.cell ?? '-',
    }));
  });
};

interface TaskListProps {
  showTitle?: boolean;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
  namespace: string;
}

const TasksList: FC<TaskListProps> = ({
  showTitle = true,
  hideNameLabelFilters = false,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;

  const columns = [
    {
      title: t('Name'),
      id: 'name',
      sort: 'metadata.name',
      props: { ...cellIsStickyProps, modifier: 'nowrap' },
    },
    {
      title: t('Namespace'),
      id: 'namespace',
      sort: 'metadata.namespace',
      props: { modifier: 'nowrap' },
    },
    {
      title: t('Created'),
      id: 'created',
      sort: 'metadata.creationTimestamp',
      props: { modifier: 'nowrap' },
    },
    {
      title: '',
      id: 'actions',
    },
  ];
  const [data, loaded, loadError] = useK8sWatchResource<TaskKind[]>({
    groupVersionKind: getGroupVersionKindForModel(TaskModel),
    isList: true,
    namespaced: true,
    namespace,
  });

  const { filterValues, onFilterChange, onClearAll, filteredData } =
    useDataViewFilter<TaskKind>({
      data: data || [],
    });

  return (
    <ListPageBody>
      {!showTitle && (
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(TaskModel),
            namespace,
          }}
          to={
            !namespace
              ? `/k8s/cluster/${taskModelRef}/~new`
              : `/k8s/ns/${namespace}/${taskModelRef}/~new`
          }
        >
          {t('Create {{resourceKind}}', { resourceKind: TaskModel.kind })}
        </ListPageCreateLink>
      )}
      {!hideNameLabelFilters && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      )}
      <ConsoleDataView
        label={t('Tasks')}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        columns={columns as any}
        getDataViewRows={getTaskDataViewRows as any}
        showNamespaceOverride
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default TasksList;
