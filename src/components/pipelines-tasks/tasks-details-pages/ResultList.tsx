import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ComputedStatus, TektonResultsRun } from '../../../types';
import { SectionHeading } from './headings';
import { handleURLs } from '../../utils/render-utils';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
  status: string;
}

const ResultsList: React.FC<ResultsListProps> = ({
  results,
  resourceName,
  status,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!results.length) return null;

  return (
    <>
      <SectionHeading text={t('{{resourceName}} results', { resourceName })} />
      {status !== ComputedStatus.Failed ? (
        <Table
          aria-label={t('{{resourceName}} results', {
            resourceName,
          })}
          data-codemods="true"
        >
          <Thead>
            <Tr>
              <Th>{t('Name')}</Th>
              <Th>{t('Value')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {results.map(({ name, value }) => (
              <Tr key={`row-${name}`}>
                <Td>{name}</Td>
                <Td>{handleURLs(value)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.full}>
            <EmptyStateBody>
              {t('No {{resourceName}} results available due to failure', {
                resourceName,
              })}
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </>
  );
};

export default ResultsList;
