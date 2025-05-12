import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { PipelineKind, TaskKind } from '../../../types';

export interface WorkspaceDefinitionListProps {
  obj: TaskKind | PipelineKind;
}

const WorkspaceDefinitionList: React.FC<WorkspaceDefinitionListProps> = ({
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!obj?.spec?.workspaces || obj?.spec?.workspaces?.length === 0)
    return null;

  return (
    <DescriptionList data-test-id="workspace-definition-section">
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Workspaces')}</DescriptionListTerm>
        <DescriptionListDescription>
          {obj.spec.workspaces.map((workspace) => (
            <div
              key={workspace.name}
              data-test-id={`workspace-definition${
                workspace?.optional ? '-optional' : ''
              }`}
            >
              {workspace?.optional
                ? `${workspace.name} (${t('optional')})`
                : `${workspace.name}`}
            </div>
          ))}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default WorkspaceDefinitionList;
