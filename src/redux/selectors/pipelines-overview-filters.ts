import { PipelinesOverviewFiltersState } from '../reducers/pipelines-overview-filters';

export const getPipelinesOverviewTimespan = (state: {
  plugins?: { pipelinesOverviewFilters?: PipelinesOverviewFiltersState };
}): number | null => {
  return state.plugins?.pipelinesOverviewFilters?.timespan ?? null;
};

export const getPipelinesOverviewInterval = (state: {
  plugins?: { pipelinesOverviewFilters?: PipelinesOverviewFiltersState };
}): number | null => {
  return state.plugins?.pipelinesOverviewFilters?.interval ?? null;
};

