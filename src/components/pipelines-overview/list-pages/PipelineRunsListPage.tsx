import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  Grid,
  GridItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import PipelineRunsForRepositoriesList from './PipelineRunsForRepositoriesList';
import PipelineRunsForPipelinesList from './PipelineRunsForPipelinesList';
import SearchInputField from '../SearchInput';
import { SummaryProps, useInterval, useQueryParams } from '../utils';
import { getResultsSummary } from '../../../components/utils/summary-api';
import { DataType } from '../../../components/utils/tekton-results';
import { getDropDownDate } from '../dateTime';
import { ALL_NAMESPACES_KEY } from '../../../consts';

type PipelineRunsListPageProps = {
  bordered?: boolean;
  namespace: string;
  timespan: number;
  interval: number;
};

const PipelineRunsListPage: React.FC<PipelineRunsListPageProps> = ({
  bordered,
  namespace,
  timespan,
  interval,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [pageFlag, setPageFlag] = React.useState(1);
  const [loaded, setloaded] = React.useState(false);
  const [summaryData, setSummaryData] = React.useState<SummaryProps[]>([]);
  const [searchText, setSearchText] = React.useState('');
  const [summaryDataFiltered, setSummaryDataFiltered] = React.useState<
    SummaryProps[]
  >([]);

  const date = getDropDownDate(timespan).toISOString();
  if (namespace == ALL_NAMESPACES_KEY) {
    namespace = '-';
  }
  const getSummaryData = () => {
    getResultsSummary(
      namespace,
      pageFlag === 1
        ? {
            summary: 'total_duration,avg_duration,total,succeeded,last_runtime',
            data_type: DataType?.PipelineRun,
            groupBy: 'pipeline',
            filter: `data.status.startTime>timestamp("${date}") && data.spec.pipelineRef.contains("name")`,
          }
        : {
            summary: 'total_duration,avg_duration,total,succeeded,last_runtime',
            data_type: DataType?.PipelineRun,
            groupBy: 'repository',
            filter: `data.status.startTime>timestamp("${date}") && data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')`,
          },
    )
      .then((response) => {
        setloaded(true);
        setSummaryData(response.summary);
        setSummaryDataFiltered(response.summary);
      })
      .catch((e) => {
        throw e;
      });
  };

  useInterval(getSummaryData, interval, namespace, date, pageFlag);

  React.useEffect(() => {
    setloaded(false);
    setSummaryData([]);
    setSummaryDataFiltered([]);
  }, [namespace, timespan]);

  useQueryParams({
    key: 'search',
    value: searchText,
    setValue: setSearchText,
    defaultValue: '',
  });

  useQueryParams({
    key: 'list',
    value: pageFlag,
    setValue: setPageFlag,
    defaultValue: 1,
    options: { perpipeline: 1, perrepository: 2 },
    displayFormat: (v) => (v == 1 ? 'perpipeline' : 'perrepository'),
    loadFormat: (v) => (v == 'perrepository' ? 2 : 1),
  });

  const handlePageChange = (pageNumber: number) => {
    setloaded(false);
    setSummaryData([]);
    setSummaryDataFiltered([]);
    setPageFlag(pageNumber);
  };
  const handleNameChange = (value: string) => {
    setSearchText(value);
    const filteredData = summaryData.filter((summary) =>
      summary.group_value
        .split('/')[1]
        .toLowerCase()
        .includes(value.toLowerCase()),
    );
    setSummaryDataFiltered(filteredData);
  };
  return (
    <Card
      className={classNames('pipeline-overview__pipelinerun-status-card', {
        'card-border': bordered,
      })}
    >
      <CardBody>
        <Grid hasGutter className="pipeline-overview__listpage__grid">
          <GridItem span={9} className="pipeline-overview__listpage__griditem">
            {/* Lastrun Status is not provided by API  */}
            {/* <StatusDropdown /> */}
            <SearchInputField
              searchText={searchText}
              pageFlag={pageFlag}
              handleNameChange={handleNameChange}
            />
          </GridItem>
          <GridItem span={3}>
            <ToggleGroup className="pipeline-overview__listpage__button">
              <ToggleGroupItem
                text={t('Per Pipeline')}
                buttonId="pipelineButton"
                isSelected={pageFlag === 1}
                onChange={() => handlePageChange(1)}
              />
              <ToggleGroupItem
                text={t('Per Repository')}
                buttonId="repositoryButton"
                isSelected={pageFlag === 2}
                onChange={() => handlePageChange(2)}
              />
            </ToggleGroup>
          </GridItem>
        </Grid>
        <Grid hasGutter>
          <GridItem span={12}>
            {pageFlag === 1 ? (
              <PipelineRunsForPipelinesList
                summaryData={summaryData}
                summaryDataFiltered={summaryDataFiltered}
                loaded={loaded}
              />
            ) : (
              <PipelineRunsForRepositoriesList
                summaryData={summaryData}
                summaryDataFiltered={summaryDataFiltered}
                loaded={loaded}
              />
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default PipelineRunsListPage;
