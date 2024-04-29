import * as React from 'react';
import { useTranslation } from 'react-i18next';
import './ApprovalRow.scss';
import {
  ListPageBody,
  ListPageFilter,
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
import {
  useApprovalTasks,
  useCustomRuns,
  usePipelineRuns,
} from '../hooks/useTaskRuns';
import ApprovalRow from './ApprovalRow';
import { useParams } from 'react-router-dom-v5-compat';
import useApprovalsColumns from './useApprovalsColumns';

type ApprovalTasksListProps = {
  namespace: string;
  hideTextFilter?: boolean;
};

const pipelineApprovalFilterReducer = (
  obj: ApprovalTaskKind,
  pipelineRuns,
  customRuns,
) => {
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const customRun = customRuns?.find(
    (cr) => cr?.metadata?.name === obj.metadata.name,
  );
  return (
    getApprovalStatus(obj, customRun, pipelineRun) || ApprovalStatus.Unknown
  );
};

const ApprovalTasksList: React.FC<ApprovalTasksListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const [pipelineRuns, pipelineRunsLoaded] = usePipelineRuns(namespace);
  const [approvalTasks, approvalTasksLoaded, approvalTasksLoadError] =
    useApprovalTasks(namespace);
  const [customRuns, customRunLoaded] = useCustomRuns(namespace);
  const columns = useApprovalsColumns();

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
        pipelineApprovalFilterReducer(obj, pipelineRuns, customRuns),
      filter: (filterValue, obj: ApprovalTaskKind) => {
        const status = pipelineApprovalFilterReducer(
          obj,
          pipelineRuns,
          customRuns,
        );
        return (
          !filterValue.selected?.length ||
          (status && filterValue.selected.includes(status))
        );
      },
      defaultSelected: [ApprovalStatus.RequestSent],
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
            <div
              className="pf-u-text-align-center virtualized-table-empty-msg"
              id="no-templates-msg"
            >
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
            customRuns: customRunLoaded ? customRuns : [],
          }}
          unfilteredData={data}
        />
      </ListPageBody>
    </>
  );
};

export default ApprovalTasksList;
