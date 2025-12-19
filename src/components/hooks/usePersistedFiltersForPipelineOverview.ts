import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom-v5-compat';
import {
  setInterval as setIntervalAction,
  setTimespan as setTimespanAction,
} from '../../redux/actions/pipelines-overview-filters';
import {
  getPipelinesOverviewInterval,
  getPipelinesOverviewTimespan,
} from '../../redux/selectors/pipelines-overview-filters';
import { useQueryParams } from '../pipelines-overview/utils';

export const usePersistedTimespanWithUrl = (
  defaultValue: number,
  options: {
    displayFormat: (v: number) => string;
    loadFormat: (v: string) => number;
    options: Record<string, any>;
  },
  namespace: string,
) => {
  const dispatch = useDispatch();
  const reduxTimespan = useSelector(getPipelinesOverviewTimespan);
  const location = useLocation();
  const prevNamespaceRef = React.useRef(namespace);
  const [timespan, setTimespanValue] = React.useState(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlValue = urlParams.has('timerange')
      ? urlParams.get('timerange')
      : null;
    if (urlValue) {
      return options.loadFormat(urlValue);
    }
    return reduxTimespan ?? defaultValue;
  });

  // Reset to default when namespace changes
  React.useEffect(() => {
    if (prevNamespaceRef.current !== namespace) {
      prevNamespaceRef.current = namespace;
      setTimespanValue(defaultValue);
    }
  }, [namespace, defaultValue]);

  // Persist to Redux whenever value changes
  React.useEffect(() => {
    dispatch(setTimespanAction(timespan));
  }, [timespan, dispatch]);

  useQueryParams({
    key: 'timerange',
    value: timespan,
    setValue: setTimespanValue,
    defaultValue: timespan,
    ...options,
  });

  return [timespan, setTimespanValue];
};

export const usePersistedIntervalWithUrl = (
  defaultValue: number,
  options: {
    displayFormat: (v: number | null) => string;
    loadFormat: (v: string) => number | null;
    options: Record<string, any>;
  },
  namespace: string,
) => {
  const dispatch = useDispatch();
  const reduxInterval = useSelector(getPipelinesOverviewInterval);
  const location = useLocation();
  const prevNamespaceRef = React.useRef(namespace);
  const [interval, setIntervalValue] = React.useState(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlValue = urlParams.has('refreshinterval')
      ? urlParams.get('refreshinterval')
      : null;
    if (urlValue) {
      return options.loadFormat(urlValue);
    }
    // to handle refresh interval "off" state
    return reduxInterval !== undefined ? reduxInterval : defaultValue;
  });

  // Reset to default when namespace changes
  React.useEffect(() => {
    if (prevNamespaceRef.current !== namespace) {
      prevNamespaceRef.current = namespace;
      setIntervalValue(defaultValue);
    }
  }, [namespace, defaultValue]);

  // Persist to Redux whenever value changes
  React.useEffect(() => {
    dispatch(setIntervalAction(interval));
  }, [interval, dispatch]);

  useQueryParams({
    key: 'refreshinterval',
    value: interval,
    setValue: setIntervalValue,
    defaultValue: interval,
    ...options,
  });

  return [interval, setIntervalValue];
};
