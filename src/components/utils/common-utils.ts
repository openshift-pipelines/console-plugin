/* eslint-disable @typescript-eslint/no-explicit-any */
import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { TOptions } from 'i18next';
import _ from 'lodash';
import React from 'react';
import { getI18n } from 'react-i18next';
import { RESOURCE_LOADED_FROM_RESULTS_ANNOTATION } from '../../consts';
import { Options, resourceURL } from './k8s-utils';

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

export const watchURL = (kind: K8sKind, options: Options): string => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = 'true';
  return resourceURL(kind, opts);
};

export const tektonResultsFlag = (obj) =>
  obj?.metadata?.annotations?.['results.tekton.dev/log'] ||
  obj?.metadata?.annotations?.['results.tekton.dev/record'] ||
  obj?.metadata?.annotations?.['results.tekton.dev/result'];

export const isResourceLoadedFromTR = (obj) =>
  obj?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION];

export type TruncateOptions = {
  length?: number; // Length to truncate text to
  truncateEnd?: boolean; // Flag to alternatively truncate at the end
  omission?: string; // Truncation text used to denote the truncation (ellipsis)
  minTruncateChars?: number; // Minimum number of characters to truncate
};

const DEFAULT_OPTIONS: TruncateOptions = {
  length: 20,
  truncateEnd: false,
  omission: '\u2026', // ellipsis character
  minTruncateChars: 3,
};

// Truncates a string down to `maxLength` characters when the length
// is greater than the `maxLength` + `minTruncateChars` values.
// By default the middle is truncated, set the options.truncateEnd to true to truncate at the end.
// Truncated text is replaced with the provided omission option (ellipsis character by default);
export const truncateMiddle = (
  text: string,
  options: TruncateOptions = {},
): string => {
  const { length, truncateEnd, omission, minTruncateChars } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  if (!text) {
    return text;
  }

  // Do not truncate less than the minimum truncate characters
  if (text.length <= length + minTruncateChars) {
    return text;
  }

  if (length <= omission.length) {
    return omission;
  }

  if (truncateEnd) {
    return `${text.substr(0, length - 1)}${omission}`;
  }

  const startLength = Math.ceil((length - omission.length) / 2);
  const endLength = length - startLength - omission.length;
  const startFragment = text.substr(0, startLength);
  const endFragment = text.substr(text.length - endLength);
  return `${startFragment}${omission}${endFragment}`;
};
