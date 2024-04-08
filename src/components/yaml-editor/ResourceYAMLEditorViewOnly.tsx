import * as React from 'react';
import {
  K8sResourceKind,
  ResourceYAMLEditor,
} from '@openshift-console/dynamic-plugin-sdk';

export interface ResourceYAMLEditorViewOnlyProps {
  obj: K8sResourceKind;
}

const ResourceYAMLEditorViewOnly: React.FC<ResourceYAMLEditorViewOnlyProps> = ({
  obj,
}) => {
  return <ResourceYAMLEditor initialResource={obj} readOnly />;
};

export default ResourceYAMLEditorViewOnly;
