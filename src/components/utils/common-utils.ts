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
