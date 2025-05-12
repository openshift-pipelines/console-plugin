import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import {
  ConfigMapModel,
  PersistentVolumeClaimModel,
  SecretModel,
} from '../../models';
import {
  PipelineRunWorkspace,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from '../../types';

type WorkspaceResourcesSectionProps = {
  namespace: string;
  workspaces: PipelineRunWorkspace[];
};

const WorkspaceResourcesSection: React.FC<WorkspaceResourcesSectionProps> = ({
  namespace,
  workspaces,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (!namespace || !workspaces || workspaces.length === 0) return null;

  const workspacesRenders = workspaces
    .map((workspace) => {
      if (workspace.persistentVolumeClaim) {
        const persistentVolumeClaim =
          workspace.persistentVolumeClaim as VolumeTypePVC;
        const displayName = `${persistentVolumeClaim.claimName} (${workspace.name})`;
        return (
          <ResourceLink
            key={workspace.name}
            name={persistentVolumeClaim.claimName}
            namespace={namespace}
            kind={PersistentVolumeClaimModel.kind}
            displayName={displayName}
          />
        );
      }
      if (workspace.configMap) {
        const configMap = workspace.configMap as VolumeTypeConfigMaps;
        const displayName = `${configMap.name} (${workspace.name})`;
        return (
          <ResourceLink
            key={workspace.name}
            name={configMap.name}
            namespace={namespace}
            kind={ConfigMapModel.kind}
            displayName={displayName}
          />
        );
      }
      if (workspace.secret) {
        const secret = workspace.secret as VolumeTypeSecret;
        const displayName = `${secret.secretName} (${workspace.name})`;
        return (
          <ResourceLink
            key={workspace.name}
            name={secret.secretName}
            kind={SecretModel.kind}
            namespace={namespace}
            displayName={displayName}
          />
        );
      }
      return null;
    })
    .filter((v) => !!v);

  if (workspacesRenders.length === 0) return null;

  return (
    <DescriptionListGroup data-test-id="workspace-resources-section">
      <DescriptionListTerm>{t('Workspace Resources')}</DescriptionListTerm>
      <DescriptionListDescription>
        {workspacesRenders}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default WorkspaceResourcesSection;
