import { FormikValues } from 'formik';
import {
  PipelineTask,
  TaskKind,
  TektonParam,
  TektonWorkspace,
  WhenExpression,
} from '../../types';

export enum EditorType {
  Form = 'form',
  YAML = 'yaml',
}

export type PipelineBuilderTaskResources = {
  namespacedTasks: TaskKind[];
  clusterTasks: TaskKind[];
  tasksLoaded: boolean;
};

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderListTask = PipelineBuilderTaskBase;

export type PipelineBuilderLoadingTask = PipelineBuilderTaskBase & {
  isFinallyTask: boolean;
  resource: TaskKind;
  taskRef: {
    kind: string;
    name: string;
  };
};

export type PipelineBuilderTaskGrouping = {
  tasks: PipelineTask[];
  listTasks: PipelineBuilderListTask[];
  loadingTasks: PipelineBuilderLoadingTask[];
  finallyTasks: PipelineTask[];
  finallyListTasks: PipelineBuilderListTask[];
};

export type PipelineBuilderFormValues = PipelineBuilderTaskGrouping & {
  name: string;
  params: TektonParam[];
  workspaces: TektonWorkspace[];
  when?: WhenExpression[];
};
export type PipelineBuilderFormYamlValues = {
  editorType: EditorType;
  yamlData: string;
  formData: PipelineBuilderFormValues;
  taskResources: PipelineBuilderTaskResources;
};
export type PipelineBuilderFormikValues = FormikValues &
  PipelineBuilderFormYamlValues;
