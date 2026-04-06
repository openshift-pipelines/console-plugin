import * as _ from 'lodash-es';

const replaceUrl = (url: string) => {
  window.history.replaceState(window.history.state, '', url);
};

export const history = {
  push: (url: string) => {
    window.history.pushState(window.history.state, '', url);
  },
  replace: replaceUrl,
  back: () => window.history.back(),
};

export const getQueryArgument = (arg: string) =>
  new URLSearchParams(window.location.search).get(arg);

export const setQueryArgument = (k: string, v: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.get(k) !== v) {
    params.set(k, v);
    const url = new URL(window.location.href);
    replaceUrl(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const setQueryArguments = (newParams: { [k: string]: string }) => {
  const params = new URLSearchParams(window.location.search);
  let update = false;
  _.each(newParams, (v, k) => {
    if (params.get(k) !== v) {
      update = true;
      params.set(k, v);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    replaceUrl(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const setAllQueryArguments = (newParams: { [k: string]: string }) => {
  const params = new URLSearchParams();
  let update = false;
  _.each(newParams, (v, k) => {
    if (params.get(k) !== v) {
      update = true;
      params.set(k, v);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    replaceUrl(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const removeQueryArgument = (k: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(k)) {
    params.delete(k);
    const url = new URL(window.location.href);
    replaceUrl(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const removeQueryArguments = (...keys: string[]) => {
  const params = new URLSearchParams(window.location.search);
  let update = false;
  keys.forEach((k) => {
    if (params.has(k)) {
      update = true;
      params.delete(k);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    replaceUrl(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const setOrRemoveQueryArgument = (k: string, v: string) =>
  v ? setQueryArgument(k, v) : removeQueryArgument(k);
