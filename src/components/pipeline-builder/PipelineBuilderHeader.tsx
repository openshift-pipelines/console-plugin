import * as React from 'react';
import { Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import './PipelineBuilderHeader.scss';

const PipelineBuilderHeader: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem grow={{ default: 'grow' }}>
          <PageSection hasBodyWrapper={false} isFilled className="pf-v6-u-pb-0">
            <Title headingLevel="h2">{t('Pipeline builder')}</Title>
          </PageSection>
        </FlexItem>
      </Flex>
    </div>
  );
};

export default PipelineBuilderHeader;
