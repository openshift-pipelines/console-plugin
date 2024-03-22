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
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  return <ResourceYAMLEditor initialResource={obj} onSave={() => {}} />;
};

export default ResourceYAMLEditorViewOnly;
