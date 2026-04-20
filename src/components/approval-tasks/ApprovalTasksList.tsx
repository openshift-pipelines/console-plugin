import type { FC } from 'react';
import './ApprovalRow.scss';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalTaskKind } from '../../types';
import {
  getApprovalStatus,
  getPipelineRunOfApprovalTask,
} from '../utils/pipeline-approval-utils';
import { ApprovalStatus } from '../../types';
import { useApprovalTasks, usePipelineRuns } from '../hooks/useTaskRuns';
import { useParams } from 'react-router';
import useApprovalsColumns from './useApprovalsColumns';
import { getApprovalListPageDataViewRows } from './ApprovalRow';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { useTranslation } from 'react-i18next';

type ApprovalTasksListProps = {
  namespace: string;
  hideTextFilter?: boolean;
};

export const pipelineApprovalFilterReducer = (
  obj: ApprovalTaskKind,
  pipelineRuns,
) => {
  const pipelineRun = getPipelineRunOfApprovalTask(pipelineRuns, obj);
  const status = getApprovalStatus(obj, pipelineRun);
  if (
    status === ApprovalStatus.PartiallyApproved ||
    status === ApprovalStatus.AlmostApproved
  ) {
    return ApprovalStatus.RequestSent;
  }
  return status || ApprovalStatus.Unknown;
};

export const pipelineApprovalFilter = (
  filterValue,
  obj: ApprovalTaskKind,
  pipelineRuns,
) => {
  const status = pipelineApprovalFilterReducer(obj, pipelineRuns);
  return (
    !filterValue.selected?.length ||
    (status && filterValue.selected.includes(status))
  );
};

const ApprovalTasksList: FC<ApprovalTasksListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns, name: pipelineRunName } = useParams();
  namespace = namespace || ns;
  const [pipelineRuns, k8sLoaded, trLoaded] = usePipelineRuns(namespace);
  const pipelineRunsLoaded = k8sLoaded && trLoaded;
  const [approvalTasks, approvalTasksLoaded, approvalTasksLoadError] =
    useApprovalTasks(namespace, pipelineRunName);
  const columns = useApprovalsColumns(namespace);

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<ApprovalTaskKind>({
    data: approvalTasks || [],
    resourceType: 'ApprovalTask',
    defaultStatusValues: ['pending'],
    customData: pipelineRunsLoaded ? pipelineRuns : [],
  });

  return (
    <>
      <ListPageBody>
        {!hideTextFilter && (
          <DataViewFilterToolbar
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
            checkboxFilters={updatedCheckboxFilters}
          />
        )}
        <ConsoleDataView<ApprovalTaskKind>
          label={t('ApprovalTasks')}
          columns={columns}
          data={filteredData}
          loaded={approvalTasksLoaded && pipelineRunsLoaded}
          loadError={approvalTasksLoadError}
          getDataViewRows={getApprovalListPageDataViewRows}
          customRowData={{
            pipelineRuns: pipelineRunsLoaded ? pipelineRuns : [],
          }}
          hideColumnManagement
          hideNameLabelFilters
        />
      </ListPageBody>
    </>
  );
};

export default ApprovalTasksList;
