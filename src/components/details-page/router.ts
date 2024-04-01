/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserHistory, createMemoryHistory, History } from 'history';

let createHistory;

try {
  if (process.env.NODE_ENV === 'test') {
    // Running in node. Can't use browser history
    createHistory = createMemoryHistory;
  } else {
    createHistory = createBrowserHistory;
  }
} catch (unused) {
  createHistory = createBrowserHistory;
}

export const history: History = createHistory({
  basename: (window as any).SERVER_FLAGS.basePath,
});
