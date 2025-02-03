import * as React from 'react';
import { Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { Table } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TektonResultsRun } from '../../types';
import { SectionHeading } from '../pipelines-tasks/tasks-details-pages/headings';
import { handleURLs } from '../utils/render-utils';

export interface ResultsListProps {
  results: TektonResultsRun[];
  resourceName: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, resourceName }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!results.length) return null;

  return (
    <>
      <SectionHeading text={t('{{resourceName}} results', { resourceName })} />
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
    </>
  );
};

export default ResultsList;
