import * as React from 'react';
import Helmet from 'react-helmet';
import { TFunction, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateButton,
  ListPageFilter,
  RowFilter,
  TableColumn,
  VirtualizedTable,
  useActiveColumns,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTaskRuns } from '../hooks/useTaskRuns';
import TaskRunsRow from './TaskRunsRow';
import { TaskRunModel } from '../../models';
import { ListFilterId, ListFilterLabels } from '../utils/pipelines-utils';
import {
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../utils/pipeline-filter-reducer';
import { TektonResourceLabel } from '../../consts';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useHistory } from 'react-router-dom';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
  showPipelineColumn?: boolean;
  pipelineRunName?: string;
  showLabelFilters?: boolean;
  obj?: K8sResourceCommon;
}

const taskRunModelRef = getReferenceForModel(TaskRunModel);

export const runFilters = (t: TFunction): RowFilter[] => {
  return [
    {
      filterGroupName: t('Status'),
      type: 'pipelinerun-status',
      reducer: pipelineRunFilterReducer,
      items: [
        {
          id: ListFilterId.Succeeded,
          title: ListFilterLabels[ListFilterId.Succeeded],
        },
        {
          id: ListFilterId.Running,
          title: ListFilterLabels[ListFilterId.Running],
        },
        {
          id: ListFilterId.Failed,
          title: ListFilterLabels[ListFilterId.Failed],
        },
        {
          id: ListFilterId.Cancelled,
          title: ListFilterLabels[ListFilterId.Cancelled],
        },
      ],
      filter: pipelineRunStatusFilter,
    },
  ];
};

const useTaskColumns = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');

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
      title: t('Namesapce'),
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
      sort: 'status.completionTime',
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

const TaskRunsListPage: React.FC<TaskRunsListPageProps> = ({
  hideBadge,
  showPipelineColumn = true,
  pipelineRunName,
  showLabelFilters,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const params = useParams();
  const [columns, activeColumns] = useTaskColumns();
  const history = useHistory();
  const { ns: namespace, name: parentName } = params;
  const [taskRuns, loaded, loadError] = useTaskRuns(namespace, parentName);
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    taskRuns,
    runFilters(t),
  );

  return (
    <>
      <Helmet>
        <title>{t('TaskRuns')}</title>
      </Helmet>
      <ListPageBody>
        {!showLabelFilters && !parentName && (
          <ListPageCreateButton
            onClick={() =>
              history.push(`/k8s/ns/${namespace}/${taskRunModelRef}/~new`)
            }
            id="taskrun-create-id"
          >
            {t('Create {{resourceKind}}', { resourceKind: TaskRunModel.kind })}
          </ListPageCreateButton>
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
          rowFilters={runFilters(t)}
          hideNameLabelFilters={!showLabelFilters && !parentName}
          hideColumnManagement={!showLabelFilters && !parentName}
        />
        <VirtualizedTable
          columns={activeColumns.filter(
            (item) => !(item.id === 'pipeline' && !showPipelineColumn),
          )}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={TaskRunsRow}
          unfilteredData={staticData}
        />
      </ListPageBody>
    </>
  );
};
export default TaskRunsListPage;
