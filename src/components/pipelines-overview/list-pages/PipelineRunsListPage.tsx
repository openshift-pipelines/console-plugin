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
import StatusDropdown from '../StatusDropdown';
import SearchInputField from '../SearchInput';
import { SummaryProps, useInterval } from '../utils';
import { getResultsSummary } from '../../../components/utils/summary-api';
import { DataType } from '../../../components/utils/tekton-results';
import { getDropDownDate } from '../dateTime';
import { ALL_NAMESPACES_KEY } from '../../../consts';

type PipelineRunsForPipelinesListProps = {
  bordered?: boolean;
  namespace: string;
  timespan: number;
  interval: number;
};

const PipelineRunsListPage: React.FC<PipelineRunsForPipelinesListProps> = ({
  bordered,
  namespace,
  timespan,
  interval,
}) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [pageFlag, setPageFlag] = React.useState(1);
  const [summaryData, setSummaryData] = React.useState<SummaryProps[]>([]);
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
            data_type: DataType.PipelineRun,
            groupBy: 'pipeline',
            filter: `data.status.startTime>timestamp("${date}")&&!data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')`,
          }
        : {
            summary: 'total_duration,avg_duration,total,succeeded,last_runtime',
            data_type: DataType.PipelineRun,
            groupBy: 'repository',
            filter: `data.status.startTime>timestamp("${date}")&&data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')`,
          },
    )
      .then((response) => {
        setSummaryData(response.summary);
        setSummaryDataFiltered(response.summary);
      })
      .catch((e) => {
        throw e;
      });
  };

  useInterval(getSummaryData, interval, namespace, date, pageFlag);

  const handlePageChange = (pageNumber: number) => {
    setSummaryData([]);
    setSummaryDataFiltered([]);
    setPageFlag(pageNumber);
  };
  const handleNameChange = (value: string) => {
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
            <StatusDropdown />
            <SearchInputField
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
              />
            ) : (
              <PipelineRunsForRepositoriesList
                summaryData={summaryData}
                summaryDataFiltered={summaryDataFiltered}
              />
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default PipelineRunsListPage;
