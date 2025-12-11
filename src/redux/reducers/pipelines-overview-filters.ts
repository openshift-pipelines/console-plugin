export type PipelinesOverviewFiltersState = {
  timespan: number | null;
  interval: number | null;
};

export enum ActionType {
  SET_TIMESPAN = 'SET_PIPELINES_OVERVIEW_TIMESPAN',
  SET_INTERVAL = 'SET_PIPELINES_OVERVIEW_INTERVAL',
}

type Action = {
  type: ActionType;
  payload?: {
    timespan?: number;
    interval?: number;
  };
};

const initialState: PipelinesOverviewFiltersState = {
  timespan: null,
  interval: null,
};

export const pipelinesOverviewFiltersReducer = (
  state: PipelinesOverviewFiltersState = initialState,
  action: Action,
): PipelinesOverviewFiltersState => {
  switch (action.type) {
    case ActionType.SET_TIMESPAN:
      return { ...state, timespan: action.payload?.timespan ?? null };
    case ActionType.SET_INTERVAL:
      return { ...state, interval: action.payload?.interval ?? null };
    default:
      return state;
  }
};

