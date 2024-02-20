/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  K8sModel,
  K8sResourceCommon,
  Patch,
  QueryParams,
  consoleFetchJSON,
} from '@openshift-console/dynamic-plugin-sdk';
import { Options } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import _ from 'lodash';
import { ALL_NAMESPACES_KEY } from '../../consts';
import { resourceURL, selectorToString } from './k8s-utils';

type BaseOptions = {
  name?: string;
  ns?: string;
  path?: string;
  queryParams?: QueryParams;
};

type AdapterFunc = <D extends BaseOptions>(
  func: (...args: any[]) => any,
  knownArgs: string[],
) => (options: D) => Promise<any>;

/**
 * An adapter function to call the underlying APIs with provided options.
 * @param func The function to be called.
 * @param knownArgs  The list of arguments to be provided to underlying API in order.
 * @returns The function called with provided arguments.
 */
const adapterFunc: AdapterFunc = (
  func: (...args: any[]) => any,
  knownArgs: string[],
) => {
  return (options) => {
    const args = knownArgs.map((arg) => {
      // forming opts to match underlying API signature if it's there in knownArgs
      if (arg === 'opts') {
        const { name, ns, path, queryParams } = options || {};
        return {
          ...(name && { name }),
          ...(ns && { ns }),
          ...(path && { path }),
          ...(queryParams && { queryParams }),
        };
      }
      return options[arg];
    });
    return func(...args);
  };
};
export type ConsoleFetchJSON<T = any> = {
  (
    url: string,
    method?: string,
    options?: RequestInit,
    timeout?: number,
  ): Promise<T>;
  delete(
    url: string,
    json?: any,
    options?: RequestInit,
    timeout?: number,
  ): Promise<T>;
  post(
    url: string,
    json: any,
    options?: RequestInit,
    timeout?: number,
  ): Promise<T>;
  put(
    url: string,
    json: any,
    options?: RequestInit,
    timeout?: number,
  ): Promise<T>;
  patch(
    url: string,
    json: any,
    options?: RequestInit,
    timeout?: number,
  ): Promise<T>;
};

export const k8sList = (
  model: K8sModel,
  queryParams: { [key: string]: any } = {},
  raw = false,
  requestInit: RequestInit = {},
) => {
  const query = _.map(_.omit(queryParams, 'ns'), (v, k) => {
    let newVal;
    if (k === 'labelSelector') {
      newVal = selectorToString(v);
    }
    return `${encodeURIComponent(k)}=${encodeURIComponent(newVal ?? v)}`;
  }).join('&');

  const listURL = resourceURL(model, { ns: queryParams.ns });
  return consoleFetchJSON(`${listURL}?${query}`, 'GET', requestInit, null).then(
    (result) => {
      const typedItems = result.items?.map((i) => ({
        kind: model.kind,
        apiVersion: result.apiVersion,
        ...i,
      }));
      return raw ? { ...result, items: typedItems } : typedItems;
    },
  );
};

export const k8sPatch = <R extends K8sResourceCommon>(
  model: K8sModel,
  resource: R,
  data: Patch[],
  opts: Options = {},
) => {
  const patches = _.compact(data);

  if (_.isEmpty(patches)) {
    return Promise.resolve(resource);
  }

  return consoleFetchJSON.patch(
    resourceURL(
      model,
      Object.assign(
        {
          ns: resource.metadata.namespace,
          name: resource.metadata.name,
        },
        opts,
      ),
    ),
    patches,
    null,
    null,
  );
};

export const k8sKill = <R extends K8sResourceCommon>(
  model: K8sModel,
  resource: R,
  opts: Options = {},
  requestInit: RequestInit = {},
  json: Record<string, any> = null,
) => {
  const { propagationPolicy } = model;
  const jsonData =
    json ??
    (propagationPolicy && {
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy,
    });
  return consoleFetchJSON.delete(
    resourceURL(
      model,
      Object.assign(
        { ns: resource.metadata.namespace, name: resource.metadata.name },
        opts,
      ),
    ),
    jsonData,
    requestInit,
    null,
  );
};

type OptionsPatch<R> = BaseOptions & {
  model: K8sModel;
  resource: R;
  data: Patch[];
};

type K8sPatchResource = <R extends K8sResourceCommon>(
  options: OptionsPatch<R>,
) => Promise<R>;

export const k8sPatchResource: K8sPatchResource = adapterFunc(k8sPatch, [
  'model',
  'resource',
  'data',
  'opts',
]);

type ResourceUrlProps = {
  activeNamespace?: string;
  model: K8sModel;
  resource?: K8sResourceCommon;
};

/**
 * function for getting a resource URL
 * @param {ResourceUrlProps} urlProps - object with model, resource to get the URL from (optional) and active namespace/project name (optional)
 * @returns {string} the URL for the resource
 */
export const getResourceUrl = (urlProps: ResourceUrlProps): string => {
  const { activeNamespace, model, resource } = urlProps;

  if (!model) return null;
  const { crd, namespaced, plural } = model;

  const namespace =
    resource?.metadata?.namespace ||
    (activeNamespace !== ALL_NAMESPACES_KEY && activeNamespace);
  const namespaceUrl = namespace ? `ns/${namespace}` : 'all-namespaces';

  const ref = crd
    ? `${model.apiGroup || 'core'}~${model.apiVersion}~${model.kind}`
    : plural || '';
  const name = resource?.metadata?.name || '';

  return `/k8s/${namespaced ? namespaceUrl : 'cluster'}/${ref}/${name}`;
};
