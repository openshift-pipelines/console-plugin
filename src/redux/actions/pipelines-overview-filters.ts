import { ActionType } from '../reducers/pipelines-overview-filters';

export const setTimespan = (timespan: number) => ({
  type: ActionType.SET_TIMESPAN,
  payload: { timespan },
});

export const setInterval = (interval: number) => ({
  type: ActionType.SET_INTERVAL,
  payload: { interval },
});

