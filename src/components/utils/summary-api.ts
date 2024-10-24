import { SummaryProps } from '../pipelines-overview/utils';
import { consoleProxyFetchJSON } from './proxy';
import {
  TektonResultsOptions,
  createTektonResultsSummaryUrl,
} from './tekton-results';

export type SummaryResponse = {
  summary: SummaryProps[];
};

export const getResultsSummary = async (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
) => {
  const url = await createTektonResultsSummaryUrl(
    namespace,
    options,
    nextPageToken,
  );
  try {
    const sData: SummaryResponse = await consoleProxyFetchJSON({
      url,
      method: 'GET',
      allowInsecure: true,
      allowAuthHeader: true,
    });

    return sData;
  } catch (e) {
    console.log('Summary API Error', e);
    throw e;
  }
};
