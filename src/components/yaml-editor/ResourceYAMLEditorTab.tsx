import * as React from 'react';
import {
  K8sResourceKind,
  ResourceYAMLEditor,
} from '@openshift-console/dynamic-plugin-sdk';

export interface ResourceYAMLEditorTabProps {
  obj: K8sResourceKind;
}

const ResourceYAMLEditorTab: React.FC<ResourceYAMLEditorTabProps> = ({
  obj,
}) => {
  return <ResourceYAMLEditor initialResource={obj} />;
};

export default ResourceYAMLEditorTab;
