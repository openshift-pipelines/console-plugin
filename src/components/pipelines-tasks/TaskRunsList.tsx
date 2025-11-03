import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { SortByDirection, sortable } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateLink,
  TableColumn,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useActiveColumns,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTaskRuns } from '../hooks/useTaskRuns';
import TaskRunsRow from './TaskRunsRow';
import { TaskRunModel } from '../../models';
import { ALL_NAMESPACES_KEY, TektonResourceLabel } from '../../consts';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useTaskRunsFilters } from './useTaskRunsFilters';
import { useLoadMoreOnScroll } from '../utils/tekton-results';
import { ListPageFilter } from '../list-pages/ListPageFilter';
import { sortPipelineAndTaskRunsByDuration } from '../pipelines-details/pipeline-step-utils';

interface TaskRunsListPageProps {
  showTitle?: boolean;
  showPipelineColumn?: boolean;
  obj?: K8sResourceCommon;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
}

const taskRunModelRef = getReferenceForModel(TaskRunModel);

const useTaskColumns = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const columns: TableColumn<K8sResourceCommon>[] = [
    {
      id: 'name',
      sort: 'metadata.name',
      title: t('Name'),
      transforms: [sortable],
    },
    {
      id: 'namespace',
      sort: 'metadata.namespace',
      title: t('Namespace'),
      transforms: [sortable],
    },
    {
      id: 'pipeline',
      sort: `metadata.labels["${TektonResourceLabel.pipeline}"]`,
      title: t('Pipeline'),
      transforms: [sortable],
    },
    {
      id: 'task',
      sort: `metadata.labels["${TektonResourceLabel.pipelineTask}"]`,
      title: t('Task'),
      transforms: [sortable],
    },
    {
      id: 'pod',
      sort: 'status.podName',
      title: t('Pod'),
      transforms: [sortable],
    },
    {
      id: 'taskrunstatus',
      sort: 'status.conditions[0].reason',
      title: t('Status'),
      transforms: [sortable],
    },
    {
      id: 'starttime',
      sort: 'status.startTime',
      title: t('Started'),
      transforms: [sortable],
    },
    {
      id: 'duration',
      sort: sortPipelineAndTaskRunsByDuration,
      title: t('Duration'),
      transforms: [sortable],
      additional: true,
    },
    {
      id: '',
      props: { className: 'dropdown-kebab-pf pf-v5-c-table__action' },
      title: '',
    },
  ];

  const [activeColumns] = useActiveColumns<K8sResourceCommon>({
    columns: columns,
    showNamespaceOverride: false,
    columnManagementID: TaskRunModel.kind,
  });

  return [columns, activeColumns];
};

const TaskRunsList: React.FC<TaskRunsListPageProps> = ({
  showPipelineColumn = true,
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [columns, activeColumns] = useTaskColumns();
  const params = useParams();
  const { ns: namespace } = params;
  const ns = namespace === ALL_NAMESPACES_KEY ? '-' : namespace;
  const sortColumnIndex = !namespace ? 6 : 5;
  const parentName = props?.obj?.metadata?.name;
  const parentUid = props?.obj?.metadata?.uid;
  const [taskRuns, loaded, loadError, nextPageToken] = useTaskRuns(
    ns,
    parentName,
    undefined,
    undefined,
    parentUid,
  );
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    taskRuns,
    useTaskRunsFilters(),
  );

  useLoadMoreOnScroll(loadMoreRef, nextPageToken, loaded);

  return (
    <>
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
        <ListPageFilter
          data={staticData}
          onFilterChange={onFilterChange}
          loaded={loaded}
          columnLayout={{
            columns: columns?.map(({ additional, id, title }) => ({
              additional,
              id,
              title,
            })),
            id: TaskRunModel.kind,
            selectedColumns: new Set(activeColumns?.map((col) => col?.id)),
            type: t('TaskRuns'),
          }}
          rowFilters={useTaskRunsFilters()}
          hideColumnManagement={hideColumnManagement}
          hideLabelFilter={hideNameLabelFilters}
          hideNameLabelFilters={hideNameLabelFilters}
        />
        <VirtualizedTable
          key={sortColumnIndex}
          columns={activeColumns.filter(
            (item) => !(item.id === 'pipeline' && !showPipelineColumn),
          )}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={TaskRunsRow}
          unfilteredData={staticData}
          NoDataEmptyMsg={() => (
            <div className="cp-text-align-center" id="no-resource-msg">
              {t('No TaskRuns found')}
            </div>
          )}
          sortColumnIndex={sortColumnIndex}
          sortDirection={SortByDirection.desc}
        />
        <div ref={loadMoreRef}></div>
      </ListPageBody>
    </>
  );
};
export default TaskRunsList;
