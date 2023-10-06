import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Grid, GridItem, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { mainDataType } from '../utils';
import PipelineRunsForRepositoriesList from './PipelineRunsForRepositoriesList';
import PipelineRunsForPipelinesList from './PipelineRunsForPipelinesList';
import StatusDropdown from '../StatusDropdown';
import SearchInputField from '../SearchInput';

type PipelineRunsForPipelinesListProps = {
  mainData?: mainDataType[];
};

const PipelineRunsListPage: React.FC<PipelineRunsForPipelinesListProps> = ({ mainData }) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const [pageFlag, setPageFlag] = React.useState(1);
  const handlePageChange = (pageNumber: number) => {
    setPageFlag(pageNumber);
  };
  return (
    <Card className="pipeline-overview__pipelinerun-status-card">
      <CardBody className="pipeline-overview__pipelinerun-status-card__title">
        <Grid hasGutter className="pipeline-overview__listpage__grid">
          <GridItem span={9} className="pipeline-overview__listpage__griditem">
            <StatusDropdown />
            <SearchInputField pageFlag={pageFlag} />
          </GridItem>
          <GridItem span={3}>
            <ToggleGroup className="pipeline-overview__listpage__button">
              <ToggleGroupItem text={t('Per repository')} buttonId="repositoryButton" isSelected={pageFlag === 2} onChange={() => handlePageChange(2)} />
              <ToggleGroupItem text={t('Per pipeline')} buttonId="pipelineButton" isSelected={pageFlag === 1} onChange={() => handlePageChange(1)} />
            </ToggleGroup>
          </GridItem>
        </Grid>
        <Grid hasGutter>
          <GridItem span={12}>
            {pageFlag === 1 ? (
              <PipelineRunsForPipelinesList mainData={mainData} />
            ) : (
              <PipelineRunsForRepositoriesList mainData={mainData} />
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default PipelineRunsListPage;
