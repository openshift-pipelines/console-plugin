import { useTranslation } from 'react-i18next';
import {
  pipelineRunFilterReducer,
  pipelineRunStatusFilter,
} from '../utils/pipeline-filter-reducer';
import { ListFilterId, ListFilterLabels } from '../utils/pipeline-utils';

export const usePipelineRunsFilters = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
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
        { id: ListFilterId.Other, title: ListFilterLabels[ListFilterId.Other] },
      ],
      filter: pipelineRunStatusFilter,
    },
  ];
};
