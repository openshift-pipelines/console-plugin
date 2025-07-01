import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { usePipelineTriggerTemplateNames } from '../utils/triggers';
import TriggerResourceLinks from './TriggerResourceLinks';
import { SidebarSectionHeading } from '../pipelines-tasks/tasks-details-pages/headings';
import { PipelineKind } from '../../types';
import { TriggerTemplateModel } from '../../models';

type TriggersOverviewProps = {
  pipeline: PipelineKind;
};

const TriggersOverview: React.FC<TriggersOverviewProps> = ({ pipeline }) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];

  return templateNames.length > 0 ? (
    <>
      <SidebarSectionHeading
        data-testid="triggers-heading"
        text={t('Triggers')}
      />
      <ul className="list-group" data-testid="triggers-list">
        <li
          className="list-group-item pipeline-overview"
          data-testid="triggers-list-item"
        >
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem>
              <TriggerResourceLinks
                namespace={namespace}
                model={TriggerTemplateModel}
                links={templateNames}
              />
            </FlexItem>
          </Flex>
        </li>
      </ul>
    </>
  ) : null;
};

export default TriggersOverview;
