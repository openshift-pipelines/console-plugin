import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { PipelineRunWorkspace } from '../../types';

type EmptyDirectoriesSectionProps = {
  workspaces: PipelineRunWorkspace[];
};

const EmptyDirectoriesSection: React.FC<EmptyDirectoriesSectionProps> = ({
  workspaces,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (!workspaces || workspaces.length === 0) return null;

  const emptyDirectoryWorkspaces = workspaces.filter(
    (workspace) => !!workspace.emptyDir,
  );
  if (emptyDirectoryWorkspaces.length === 0) return null;

  return (
    <DescriptionListGroup data-test-id="empty-directories-section">
      <DescriptionListTerm>{t('Empty Directories')}</DescriptionListTerm>
      <DescriptionListDescription>
        {emptyDirectoryWorkspaces.map((workspace) => (
          <div key={workspace.name} data-test-id="empty-directory-workspace">
            {t(`Empty Directory ({{workspaceName}})`, {
              workspaceName: workspace.name,
            })}
          </div>
        ))}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default EmptyDirectoriesSection;
