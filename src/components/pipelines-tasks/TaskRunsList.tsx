import type { FC } from 'react';
import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom-v5-compat';
import { SortByDirection } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  ResourceLink,
  RowProps,
  Timestamp,
  getGroupVersionKindForModel,
  ListPageBody,
  ListPageCreateLink,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { ArchiveIcon } from '@patternfly/react-icons';
import { Tooltip } from '@patternfly/react-core';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { TaskRunModel, PipelineModel } from '../../models';
import {
  ALL_NAMESPACES_KEY,
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  TektonResourceLabel,
} from '../../consts';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { sortPipelineAndTaskRunsByDuration } from '../pipelines-details/pipeline-step-utils';
import { TaskRunKind } from '../../types';
import { taskRunFilterReducer } from '../utils/pipeline-filter-reducer';
import TaskRunStatus from './TaskRunStatus';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { getModelReferenceFromTaskKind } from '../utils/pipeline-augment';
import { pipelineRunDuration } from '../utils/pipeline-utils';
import { TaskRunKebab } from './TaskRunsRow';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

import './TasksNavigationPage.scss';

const taskRunModelRef = getReferenceForModel(TaskRunModel);
const pipelineReference = getReferenceForModel(PipelineModel);

const getTaskRunDataViewRows =
  (showPipelineColumn: boolean) =>
  (data: RowProps<TaskRunKind>[], columns: { id: string }[]) => {
    return data.map(({ obj }) => {
      const rowCells: Record<
        string,
        { cell: React.ReactNode; props?: object }
      > = {
        name: {
          cell: (
            <ResourceLinkWithIcon
              kind={taskRunModelRef}
              model={TaskRunModel}
              name={obj.metadata.name}
              namespace={obj.metadata.namespace}
              data-test-id={obj.metadata.name}
              nameSuffix={
                <>
                  {obj?.metadata?.annotations?.[
                    DELETED_RESOURCE_IN_K8S_ANNOTATION
                  ] === 'true' ||
                  obj?.metadata?.annotations?.[
                    RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
                  ] === 'true' ? (
                    <Tooltip content="Archived in Tekton results">
                      <div className="task-run-list__results-indicator">
                        <ArchiveIcon />
                      </div>
                    </Tooltip>
                  ) : null}
                </>
              }
            />
          ),
          props: getNameCellProps(obj.metadata.name),
        },
        namespace: {
          cell: <ResourceLink kind="Namespace" name={obj.metadata.namespace} />,
        },
        pipeline: {
          cell: obj.metadata.labels?.[TektonResourceLabel.pipeline] ? (
            <ResourceLink
              kind={pipelineReference}
              name={obj.metadata.labels[TektonResourceLabel.pipeline]}
              namespace={obj.metadata.namespace}
            />
          ) : (
            '-'
          ),
        },
        task: {
          cell:
            obj.spec.taskRef?.resolver === 'cluster' ? (
              (() => {
                const taskName = obj.spec.taskRef?.params?.find(
                  (param) => param.name === 'name',
                )?.value;
                const taskNamespace = obj.spec.taskRef?.params?.find(
                  (param) => param.name === 'namespace',
                )?.value;
                return taskName ? (
                  <ResourceLink
                    kind={getModelReferenceFromTaskKind('Task')}
                    displayName={
                      obj.metadata.labels?.[TektonResourceLabel.pipelineTask]
                    }
                    name={taskName}
                    namespace={taskNamespace || obj.metadata.namespace}
                  />
                ) : (
                  '-'
                );
              })()
            ) : obj.spec.taskRef?.name ? (
              <ResourceLink
                kind={getModelReferenceFromTaskKind(obj.spec.taskRef?.kind)}
                displayName={
                  obj.metadata.labels?.[TektonResourceLabel.pipelineTask]
                }
                name={obj.spec.taskRef.name}
                namespace={obj.metadata.namespace}
              />
            ) : (
              '-'
            ),
        },
        pod: {
          cell: obj.status?.podName ? (
            <ResourceLink
              kind="Pod"
              name={obj.status.podName}
              namespace={obj.metadata.namespace}
            />
          ) : (
            '-'
          ),
        },
        taskrunstatus: {
          cell: (
            <TaskRunStatus status={taskRunFilterReducer(obj)} taskRun={obj} />
          ),
        },
        starttime: {
          cell: <Timestamp timestamp={obj?.status?.startTime} />,
        },
        duration: {
          cell: pipelineRunDuration(obj),
        },
        actions: {
          cell: <TaskRunKebab obj={obj} />,
          props: actionsCellProps,
        },
      };

      return columns
        .filter(({ id }) => id !== 'pipeline' || showPipelineColumn)
        .map(({ id }) => ({
          id,
          props: rowCells[id]?.props,
          cell: rowCells[id]?.cell ?? '-',
        }));
    });
  };

interface TaskRunsListPageProps {
  showTitle?: boolean;
  showPipelineColumn?: boolean;
  obj?: K8sResourceCommon;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
}

const TaskRunsList: FC<TaskRunsListPageProps> = ({
  showTitle = true,
  showPipelineColumn = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const { ns: namespace } = params;
  const ns = namespace === ALL_NAMESPACES_KEY ? '-' : namespace;
  const parentName = props?.obj?.metadata?.name;
  const parentUid = props?.obj?.metadata?.uid;

  const columnManagementID = taskRunModelRef;

  const columns = useMemo(
    () => [
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
      ...(showPipelineColumn
        ? [
            {
              title: t('Pipeline'),
              id: 'pipeline',
              sort: `metadata.labels["${TektonResourceLabel.pipeline}"]`,
              props: { modifier: 'nowrap' },
            },
          ]
        : []),
      {
        title: t('Task'),
        id: 'task',
        sort: `metadata.labels["${TektonResourceLabel.pipelineTask}"]`,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('Pod'),
        id: 'pod',
        sort: 'status.podName',
        props: { modifier: 'nowrap' },
      },
      {
        title: t('Status'),
        id: 'taskrunstatus',
        sort: 'status.conditions[0].reason',
        props: { modifier: 'nowrap' },
      },
      {
        title: t('Started'),
        id: 'starttime',
        sort: 'status.startTime',
        props: { modifier: 'nowrap' },
      },
      {
        title: t('Duration'),
        id: 'duration',
        sort: (data: TaskRunKind[], direction: SortByDirection) =>
          sortPipelineAndTaskRunsByDuration(data, direction),
        props: { modifier: 'nowrap' },
        additional: true,
      },
      {
        title: '',
        id: 'actions',
      },
    ],
    [showPipelineColumn],
  );

  const [activeColumns] = useActiveColumns({
    columns: columns as any,
    showNamespaceOverride: false,
    columnManagementID,
  });

  // Excludes the actions column (empty title) from column management
  const columnLayout = {
    id: columnManagementID,
    type: t('TaskRun'),
    columns: columns
      .filter((col) => col.title !== '')
      .map((col) => ({
        id: col.id,
        title: col.title,
        additional: col.additional,
      })),
    selectedColumns: new Set(activeColumns.map((col) => col.id)),
  };

  const [taskRuns, k8sLoaded, trLoaded, loadError] = useTaskRuns(
    ns,
    parentName,
    undefined,
    parentUid,
  );

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<TaskRunKind>({
    data: taskRuns || [],
    resourceType: 'TaskRun',
    defaultDataSourceValues: ['cluster-data'],
  });

  const loaded = useMemo(() => {
    const selectedSources = filterValues?.dataSource as string[] | undefined;
    const bothOrNone =
      !selectedSources?.length ||
      (selectedSources.includes('cluster-data') &&
        selectedSources.includes('archived-data'));
    if (bothOrNone) return k8sLoaded && trLoaded;
    if (selectedSources.includes('cluster-data')) return k8sLoaded;
    return trLoaded;
  }, [k8sLoaded, trLoaded, filterValues?.dataSource]);

  /* Set default sort in console data view by started time */
  useEffect(() => {
    if (!searchParams.has('sortBy')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sortBy', t('Started'));
        next.set('orderBy', 'desc');
        return next;
      });
    }
  }, []);

  return (
    <ListPageBody>
      {!showTitle && (
        <ListPageCreateLink
          createAccessReview={{
            groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
            namespace,
          }}
          to={
            !namespace
              ? `/k8s/cluster/${taskRunModelRef}/~new`
              : `/k8s/ns/${namespace}/${taskRunModelRef}/~new`
          }
        >
          {t('Create {{resourceKind}}', { resourceKind: TaskRunModel.kind })}
        </ListPageCreateLink>
      )}
      {!hideNameLabelFilters && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={updatedCheckboxFilters}
        />
      )}
      <ConsoleDataView
        label={t('TaskRuns')}
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        columns={activeColumns}
        columnLayout={columnLayout}
        columnManagementID={columnManagementID}
        getDataViewRows={getTaskRunDataViewRows(showPipelineColumn)}
        hideColumnManagement={hideColumnManagement}
        hideNameLabelFilters
      />
      <div ref={loadMoreRef} />
    </ListPageBody>
  );
};

export default TaskRunsList;
