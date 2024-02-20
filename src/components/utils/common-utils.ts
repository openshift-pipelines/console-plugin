/* eslint-disable @typescript-eslint/no-explicit-any */
import { TOptions } from 'i18next';
import _ from 'lodash';
import React from 'react';
import { getI18n } from 'react-i18next';

export const t = (value: string, options?: TOptions) =>
  getI18n().t(value, { ns: 'plugin__pipelines-console-plugin', ...options });

export const useDeepCompareMemoize = <T = any>(
  value: T,
  strinfigy?: boolean,
): T => {
  const ref = React.useRef<T>();

  if (
    strinfigy
      ? JSON.stringify(value) !== JSON.stringify(ref.current)
      : !_.isEqual(value, ref.current)
  ) {
    ref.current = value;
  }

  return ref.current;
};
