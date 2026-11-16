import { ClusterQueueKind, QueueingStrategy } from '../../types';
import { EditorType } from '../pipeline-builder/types';

export type ClusterQueueFlavorFormValues = {
  name: string;
  cpu: string;
  memory: string;
  originalName?: string;
};

export type ClusterQueueFormValues = {
  name: string;
  cohort: string;
  queueingStrategy: QueueingStrategy;
  flavors: ClusterQueueFlavorFormValues[];
  // Keep the source resource so fields outside the form survive conversion.
  resource: ClusterQueueKind;
};

export type ClusterQueueEditorValues = {
  editorType: EditorType;
  formData: ClusterQueueFormValues;
  yamlData: string;
};
