import * as React from 'react';
import { useTranslation } from 'react-i18next';
import './ApprovalRow.scss';
import {
  ListPageBody,
  RowFilter,
  VirtualizedTable,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskKind } from 'src/types';
import {
  getApprovalStatus,
  getApprovalStatusInfo,
  getPipelineRunOfApprovalTask,
} from '../utils/pipeline-approval-utils';
import { ApprovalStatus } from '../../types';
import { useApprovalTasks, usePipelineRuns } from '../hooks/useTaskRuns';
import { useParams } from 'react-router-dom-v5-compat';
import useApprovalsColumns from './useApprovalsColumns';
import ApprovalRow from './ApprovalRow';
import { ListPageFilter } from '../list-pages/ListPageFilter';

type ApprovalTasksListProps = {
  namespace: string;
  hideTextFilter?: boolean;
};

const pipelineApprovalFilterReducer = (obj: ApprovalTaskKind, pipelineRuns) => {
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  return getApprovalStatus(obj, pipelineRun) || ApprovalStatus.Unknown;
};

const ApprovalTasksList: React.FC<ApprovalTasksListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns, name: pipelineRunName } = useParams();
  namespace = namespace || ns;
  const [pipelineRuns, pipelineRunsLoaded] = usePipelineRuns(namespace);
  const [approvalTasks, approvalTasksLoaded, approvalTasksLoadError] =
    useApprovalTasks(namespace, pipelineRunName);
  const columns = useApprovalsColumns(namespace);

  const filters: RowFilter<ApprovalTaskKind>[] = [
    {
      filterGroupName: t('Approval status'),
      type: 'status',
      items: [
        {
          id: ApprovalStatus.Accepted,
          title: getApprovalStatusInfo(ApprovalStatus.Accepted).message,
        },
        {
          id: ApprovalStatus.Rejected,
          title: getApprovalStatusInfo(ApprovalStatus.Rejected).message,
        },
        {
          id: ApprovalStatus.RequestSent,
          title: getApprovalStatusInfo(ApprovalStatus.RequestSent).message,
        },
        {
          id: ApprovalStatus.TimedOut,
          title: getApprovalStatusInfo(ApprovalStatus.TimedOut).message,
        },
      ],
      reducer: (obj: ApprovalTaskKind) =>
        pipelineApprovalFilterReducer(obj, pipelineRuns),
      filter: (filterValue, obj: ApprovalTaskKind) => {
        const status = pipelineApprovalFilterReducer(obj, pipelineRuns);
        return (
          !filterValue.selected?.length ||
          (status && filterValue.selected.includes(status))
        );
      },
      ...(!pipelineRunName && {
        defaultSelected: [ApprovalStatus.RequestSent],
      }),
    },
  ];

  const [data, filteredData, onFilterChange] = useListPageFilter(
    approvalTasks,
    filters,
  );

  return (
    <>
      <ListPageBody>
        <ListPageFilter
          columnLayout={{
            columns: columns?.map(({ id, title }) => ({ id, title })),
            id: 'approvals-list',
            type: 'ApprovalTask',
            selectedColumns: new Set(['name']),
          }}
          rowFilters={filters}
          onFilterChange={onFilterChange}
          data={data}
          loaded={approvalTasksLoaded}
          hideColumnManagement
          hideNameLabelFilters={hideTextFilter}
        />
        <VirtualizedTable<ApprovalTaskKind>
          EmptyMsg={() => (
            <div className="cp-text-align-center" id="no-resource-msg">
              {t('No ApprovalTasks found')}
            </div>
          )}
          columns={columns}
          data={filteredData}
          loaded={approvalTasksLoaded}
          loadError={approvalTasksLoadError}
          Row={ApprovalRow}
          rowData={{
            pipelineRuns: pipelineRunsLoaded ? pipelineRuns : [],
          }}
          unfilteredData={data}
        />
      </ListPageBody>
    </>
  );
};

export default ApprovalTasksList;
