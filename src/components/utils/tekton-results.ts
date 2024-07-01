/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MatchExpression,
  MatchLabels,
  Selector,
  k8sGet,
} from '@openshift-console/dynamic-plugin-sdk';
import _ from 'lodash';
import {
  ALL_NAMESPACES_KEY,
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../consts';
import { TektonResultModel } from '../../models';
import { K8sResourceKind } from '../../types/openshift';

// REST API spec
// https://github.com/tektoncd/results/blob/main/docs/api/rest-api-spec.md

// const URL_PREFIX = `/apis/results.tekton.dev/v1alpha2/parents/`;

const MINIMUM_PAGE_SIZE = 5;
const MAXIMUM_PAGE_SIZE = 10000;

let cachedTektonResultsAPI: string = null;

export type ResultRecord = {
  name: string;
  uid: string;
  createTime: string;
  updateTime: string;
  etag: string;
  data: {
    // tekton.dev/v1beta1.PipelineRun | tekton.dev/v1beta1.TaskRun | results.tekton.dev/v1alpha2.Log
    type: string;
    value: string;
  };
};

export type Log = {
  result: {
    name: string;
    data: string;
  };
};

export type RecordsList = {
  nextPageToken?: string;
  records: ResultRecord[];
};

export type TektonResultsOptions = {
  pageSize?: number;
  selector?: Selector;
  // limit cannot be used in conjuction with pageSize and takes precedence
  limit?: number;
  filter?: string;
  summary?: string;
  data_type?: DataType;
  groupBy?: string;
};

// decoding result base64
export const decodeValue = (value: string) => atob(value);

export const decodeValueJson = (value: string) => {
  const decodedValue = value ? JSON.parse(decodeValue(value)) : null;
  let resourceDeletedInK8sAnnotation;
  if (_.has(decodedValue?.metadata, 'deletionTimestamp')) {
    delete decodedValue?.metadata?.deletionTimestamp;
    resourceDeletedInK8sAnnotation = {
      [DELETED_RESOURCE_IN_K8S_ANNOTATION]: 'true',
    };
  }
  const decodedValueWithTRAnnotation = decodedValue
    ? {
        ...decodedValue,
        metadata: {
          ...decodedValue?.metadata,
          annotations: {
            ...decodedValue?.metadata?.annotations,
            [RESOURCE_LOADED_FROM_RESULTS_ANNOTATION]: 'true',
            ...resourceDeletedInK8sAnnotation,
          },
        },
      }
    : null;
  return decodedValueWithTRAnnotation;
};

// filter functions
export const AND = (...expressions: string[]) =>
  expressions.filter((x) => x).join(' && ');
export const OR = (...expressions: string[]) => {
  const filteredExpressions = expressions.filter((x) => x);
  const filter = filteredExpressions.join(' || ');
  return filteredExpressions.length > 1 ? `(${filter})` : filter;
};

const EXP = (left: string, right: string, operator: string) =>
  `${left} ${operator} ${right}`;
export const EQ = (left: string, right: string) =>
  EXP(left, `"${right}"`, '==');
export const NEQ = (left: string, right: string) =>
  EXP(left, `"${right}"`, '!=');

export enum DataType {
  PipelineRun = 'tekton.dev/v1beta1.PipelineRun',
  TaskRun = 'tekton.dev/v1beta1.TaskRun',
  Log = 'results.tekton.dev/v1alpha2.Log',
}

export const labelsToFilter = (labels?: MatchLabels): string =>
  labels
    ? AND(
        ...Object.keys(labels).map((label) =>
          EQ(`data.metadata.labels["${label}"]`, labels[label]),
        ),
      )
    : '';

export const nameFilter = (name?: string): string =>
  name
    ? AND(`data.metadata.name.startsWith("${name.trim().toLowerCase()}")`)
    : '';

export const expressionsToFilter = (
  expressions: Omit<MatchExpression, 'value'>[],
): string =>
  AND(
    ...expressions
      .map((expression) => {
        switch (expression.operator) {
          case 'Exists':
            return `data.metadata.labels.contains("${expression.key}")`;
          case 'DoesNotExist':
            return `!data.metadata.labels.contains("${expression.key}")`;
          case 'NotIn':
            return expression.values?.length > 0
              ? AND(
                  ...expression.values.map((value) =>
                    NEQ(`data.metadata.labels["${expression.key}"]`, value),
                  ),
                )
              : '';
          case 'In':
            return expression.values?.length > 0
              ? `data.metadata.labels["${
                  expression.key
                }"] in [${expression.values.map((value) => `"${value}"`)}]`
              : '';
          case 'Equals':
            return expression.values?.[0]
              ? EQ(
                  `data.metadata.labels["${expression.key}"]`,
                  expression.values?.[0],
                )
              : '';
          case 'NotEquals':
          case 'NotEqual':
            return expression.values?.[0]
              ? NEQ(
                  `data.metadata.labels["${expression.key}"]`,
                  expression.values?.[0],
                )
              : '';
          case 'GreaterThan':
            return expression.values?.[0]
              ? EXP(
                  `data.metadata.labels["${expression.key}"]`,
                  expression.values?.[0],
                  '>',
                )
              : '';
          case 'LessThan':
            return expression.values?.[0]
              ? EXP(
                  `data.metadata.labels["${expression.key}"]`,
                  expression.values?.[0],
                  '<',
                )
              : '';
          default:
            throw new Error(
              `Tekton results operator '${expression.operator}' conversion not implemented.`,
            );
        }
      })
      .filter((x) => x),
  );

export const selectorToFilter = (selector) => {
  let filter = '';
  if (selector) {
    const { matchLabels, matchExpressions, filterByName } = selector;

    if (filterByName) {
      filter = AND(filter, nameFilter(filterByName as string));
    }

    if (matchLabels || matchExpressions) {
      if (matchLabels) {
        filter = AND(filter, labelsToFilter(matchLabels));
      }
      if (matchExpressions) {
        filter = AND(filter, expressionsToFilter(matchExpressions));
      }
    } else {
      filter = labelsToFilter(selector as MatchLabels);
    }
  }
  return filter;
};

export const getTektonResultsAPIUrl = async () => {
  if (cachedTektonResultsAPI) {
    return cachedTektonResultsAPI;
  } else {
    const cachedTektonResult: K8sResourceKind = await k8sGet({
      model: TektonResultModel,
      name: 'result',
    });
    const targetNamespace = cachedTektonResult?.spec?.targetNamespace;
    const serverPort = cachedTektonResult?.spec?.server_port ?? '8080';
    const tlsHostname = cachedTektonResult?.spec?.tls_hostname_override;
    if (tlsHostname) {
      cachedTektonResultsAPI = `${tlsHostname}:${serverPort}`;
    } else if (targetNamespace && serverPort) {
      cachedTektonResultsAPI = `tekton-results-api-service.${targetNamespace}.svc.cluster.local:${serverPort}`;
    } else {
      cachedTektonResultsAPI = `tekton-results-api-service.openshift-pipelines.svc.cluster.local:${serverPort}`;
    }
    return cachedTektonResultsAPI;
  }
};

export const createTektonResultsSummaryUrl = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): Promise<string> => {
  const tektonResultsAPI = await getTektonResultsAPIUrl();
  const namespaceToSearch =
    namespace && namespace !== ALL_NAMESPACES_KEY ? namespace : '-';
  const URL = `https://${tektonResultsAPI}/apis/results.tekton.dev/v1alpha2/parents/${namespaceToSearch}/results/-/records/summary?${new URLSearchParams(
    {
      summary: `${options?.summary}`,
      ...(options?.groupBy ? { group_by: `${options.groupBy}` } : {}),
      // default sort should always be by `create_time desc`
      // order_by: 'create_time desc', not supported yet
      page_size: `${Math.max(
        MINIMUM_PAGE_SIZE,
        Math.min(
          MAXIMUM_PAGE_SIZE,
          options?.limit >= 0 ? options.limit : options?.pageSize ?? 30,
        ),
      )}`,
      ...(nextPageToken ? { page_token: nextPageToken } : {}),
      filter: AND(
        EQ('data_type', options.data_type?.toString()),
        options.filter,
        selectorToFilter(options?.selector),
      ),
    },
  ).toString()}`;
  return URL;
};
