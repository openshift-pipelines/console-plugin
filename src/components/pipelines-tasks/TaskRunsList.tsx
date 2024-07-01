import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceCommon,
  ListPageBody,
  ListPageCreateLink,
  ListPageFilter,
  TableColumn,
  VirtualizedTable,
  getGroupVersionKindForModel,
  useActiveColumns,
  useFlag,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTaskRunsForPipelineRunOrTask } from '@aonic-ui/pipelines';
import TaskRunsRow from './TaskRunsRow';
import { TaskRunModel } from '../../models';
import {
  ALL_NAMESPACES_KEY,
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
  TektonResourceLabel,
} from '../../consts';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useTaskRunsFilters } from './useTaskRunsFilters';
import { aonicFetchUtils } from '../utils/common-utils';

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

const TaskRunsList: React.FC<TaskRunsListPageProps> = ({
  showPipelineColumn = true,
  showTitle = true,
  hideColumnManagement = false,
  hideNameLabelFilters = false,
  ...props
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [columns, activeColumns] = useTaskColumns();
  const params = useParams();
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const { ns: namespace } = params;
  const ns = namespace === ALL_NAMESPACES_KEY ? '-' : namespace;
  const parentName = props?.obj?.metadata?.name;
  const [taskRuns, loaded, loadError] = useTaskRunsForPipelineRunOrTask(
    aonicFetchUtils,
    ns,
    undefined,
    isTektonResultEnabled,
    parentName,
  );
  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    taskRuns,
    useTaskRunsFilters(),
  );
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
          columns={activeColumns.filter(
            (item) => !(item.id === 'pipeline' && !showPipelineColumn),
          )}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          Row={TaskRunsRow}
          unfilteredData={staticData}
          NoDataEmptyMsg={() => (
            <div className="cos-status-box">
              <div className="pf-v5-u-text-align-center">
                {t('No TaskRuns found')}
              </div>
            </div>
          )}
        />
      </ListPageBody>
    </>
  );
};
export default TaskRunsList;
