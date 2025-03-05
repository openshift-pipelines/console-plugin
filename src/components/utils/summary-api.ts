import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk/lib/utils/error/http-error';
import { ALL_NAMESPACES_KEY, SUMMARY_FETCH_URL } from '../../consts';
import {
  DevConsoleEndpointResponse,
  SummaryRequest,
  SummaryResponse,
  TektonResultsOptions,
} from '../../types';
import {
  AND,
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
 * @returns The parsed summary response object
 */
const fetchResultsSummary = async (
  summaryRequest: SummaryRequest,
): Promise<SummaryResponse> => {
  const resultListResponse: DevConsoleEndpointResponse =
    await consoleFetchJSON.post(SUMMARY_FETCH_URL, summaryRequest);

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
) => {
  try {
    const { searchNamespace, searchParams } = await fetchSummaryURLConfig(
      namespace,
      options,
      nextPageToken,
    );

    let sData: SummaryResponse = await fetchResultsSummary({
      searchNamespace,
      searchParams,
    });

    return sData;
  } catch (e) {
    console.log('Summary API Error', e);
    throw e;
  }
};
