import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PipelineKind, TaskKind } from '../../../types';

export type TektonWorkspace = {
  name: string;
  description?: string;
  mountPath?: string;
  readOnly?: boolean;
  optional?: boolean;
};
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
    <dl data-test-id="workspace-definition-section">
      <dt>{t('Workspaces')}</dt>
      <dd>
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
      </dd>
    </dl>
  );
};

export default WorkspaceDefinitionList;
