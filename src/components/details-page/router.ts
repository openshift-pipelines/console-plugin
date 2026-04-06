/* eslint-disable @typescript-eslint/no-explicit-any */
export const history = {
  push: (url: string) => {
    window.history.pushState(window.history.state, '', url);
  },
  replace: (url: string) => {
    window.history.replaceState(window.history.state, '', url);
  },
  back: () => window.history.back(),
};
