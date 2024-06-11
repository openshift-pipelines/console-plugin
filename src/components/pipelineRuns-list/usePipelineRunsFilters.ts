import { RowFilter, useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { FLAG_PIPELINE_TEKTON_RESULT_INSTALLED } from '../../consts';
import {
  pipelineRunDataSourceFilter,
  pipelineRunDataSourceFilterReducer,
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../utils/pipeline-utils';

export const usePipelineRunsFilters = (): RowFilter[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const statusFilterGroup = {
    filterGroupName: t('Status'),
    type: 'pipeline-status',
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
      {
        id: ListFilterId.Other,
        title: ListFilterLabels[ListFilterId.Other],
      },
    ],
    filter: pipelineRunStatusFilter,
  };

  const dataSourceFilterGroup = {
    defaultSelected: ['cluster-data'],
    filterGroupName: t('Data source'),
    type: 'pipeline-data-source',
    reducer: pipelineRunDataSourceFilterReducer,
    items: [
      {
        id: 'cluster-data',
        title: t('Cluster'),
      },
      {
        id: 'archived-data',
        title: t('Archived'),
      },
    ],
    filter: pipelineRunDataSourceFilter,
  };

  return isTektonResultEnabled
    ? [statusFilterGroup, dataSourceFilterGroup]
    : [statusFilterGroup];
};
