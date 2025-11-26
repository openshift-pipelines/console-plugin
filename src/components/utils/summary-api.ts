import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { ALL_NAMESPACES_KEY, SUMMARY_FETCH_URL } from '../../consts';
import {
  DevConsoleEndpointResponse,
  SummaryRequest,
  SummaryResponse,
  TektonResultsOptions,
} from '../../types';
import { consoleProxyFetchJSON } from './proxy';
import {
  AND,
  createTektonResultsSummaryUrl,
  EQ,
  MAXIMUM_PAGE_SIZE,
  MINIMUM_PAGE_SIZE,
  selectorToFilter,
} from './tekton-results';

export const fetchSummaryURLConfig = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): Promise<SummaryRequest> => {
  const searchNamespace =
    namespace && namespace !== ALL_NAMESPACES_KEY ? namespace : '-';
  const searchParams = `${new URLSearchParams({
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
  }).toString()}`;
  return { searchNamespace, searchParams };
};

/**
 * Fetches the Tekton Results Summary data from the backend API
 * @param summaryRequest The request object containing the search namespace and search parameters
 * @param signal Optional AbortSignal to cancel the request
 * @param timeout Optional timeout in milliseconds (defaults to 90000ms)
 * @returns The parsed summary response object
 */
const fetchResultsSummary = async (
  summaryRequest: SummaryRequest,
  signal?: AbortSignal,
  timeout = 60000,
): Promise<SummaryResponse> => {
  const resultListResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(
      SUMMARY_FETCH_URL,
      summaryRequest,
      { signal },
      timeout,
    );

  if (!resultListResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (
    resultListResponse.statusCode < 200 ||
    resultListResponse.statusCode >= 300
  ) {
    throw new HttpError(
      `Unexpected status code: ${resultListResponse.statusCode}`,
      resultListResponse.statusCode,
      null,
      resultListResponse,
    );
  }
  try {
    return JSON.parse(resultListResponse.body) as SummaryResponse;
  } catch (e) {
    throw new Error('Failed to parse task details response body as JSON');
  }
};

export const getResultsSummary = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  isDevConsoleProxyAvailable?: boolean,
  signal?: AbortSignal,
  timeout = 60000,
) => {
  if (isDevConsoleProxyAvailable) {
    const { searchNamespace, searchParams } = await fetchSummaryURLConfig(
      namespace,
      options,
      nextPageToken,
    );

    const sData: SummaryResponse = await fetchResultsSummary(
      {
        searchNamespace,
        searchParams,
      },
      signal,
      timeout,
    );

    return sData;
  } else {
    const url = await createTektonResultsSummaryUrl(
      namespace,
      options,
      nextPageToken,
    );

    const sData: SummaryResponse = await consoleProxyFetchJSON({
      url,
      method: 'GET',
      allowInsecure: true,
      allowAuthHeader: true,
      signal,
      timeout,
    });

    return sData;
  }
};
