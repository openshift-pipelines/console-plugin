import {
  EdgeModel,
  NodeModel,
  RunStatus,
  WhenStatus,
} from '@patternfly/react-topology';
import {
  PipelineKind,
  PipelineRunKind,
  PipelineTask,
  TaskKind,
} from '../../types';
import { RouteTemplate } from '../utils/triggers';
import { AddNodeDirection, NodeType } from './const';

export type PipelineDetailsTabProps = {
  obj: PipelineKind;
  customData?: {
    templateNames: RouteTemplate[];
    queryPrefix: string;
    metricsLevel: string;
    hasUpdatePermission: boolean;
  };
};

// Builder Callbacks
export type NewTaskListNodeCallback = (direction: AddNodeDirection) => void;
export type NewTaskNodeCallback = (resource: TaskKind) => void;
export type RemoveListTaskCallback = () => void;
export type NodeSelectionCallback = (nodeData: BuilderNodeModelData) => void;

// Node Data Models
export type PipelineRunAfterNodeModelData = {
  id?: string;
  width?: number;
  height?: number;
  selected?: boolean;
  status?: RunStatus;
  whenStatus?: WhenStatus;
  pipeline?: PipelineKind;
  pipelineRun?: PipelineRunKind;
  label?: string;
  runAfterTasks?: string[];
  task: {
    name: string;
    runAfter?: string[];
  };
};

type FinallyTask = {
  name: string;
  runAfter?: string[];
  error?: string;
  selected?: boolean;
  disableTooltip?: boolean;
  onTaskSelection?: () => void;
};
type FinallyListTask = {
  name: string;
  convertList: (resource: TaskKind) => void;
  onRemoveTask: () => void;
};
type FinallyNodeTask = {
  name: string;
  runAfter: string[];
  selected?: boolean;
  isFinallyTask: boolean;
  finallyTasks: FinallyTask[];
};
export type FinallyNodeData = {
  task: FinallyNodeTask;
};

export type PipelineBuilderTaskBase = { name: string; runAfter?: string[] };

export type PipelineBuilderLoadingTask = PipelineBuilderTaskBase & {
  isFinallyTask: boolean;
  resource: TaskKind;
  taskRef: {
    kind: string;
    name: string;
  };
};

export type TaskSearchCallback = (callback: () => void) => void;

export type BuilderFinallyNodeData = {
  task: FinallyNodeTask & {
    finallyInvalidListTasks: FinallyListTask[];
    finallyLoadingTasks: PipelineBuilderLoadingTask[];
    finallyListTasks: FinallyListTask[];
    addNewFinallyListNode?: () => void;
    onTaskSearch: TaskSearchCallback;
  };
};
export type FinallyNodeModel = FinallyNodeData & {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
  isFinallyTask: boolean;
};
export type LoadingNodeModel = PipelineRunAfterNodeModelData & {
  isFinallyTask: boolean;
};
export type BuilderFinallyNodeModel = BuilderFinallyNodeData & {
  clusterResolverTaskList: TaskKind[];
  namespaceTaskList: TaskKind[];
  namespace: string;
  isFinallyTask: boolean;
};

export type TaskListNodeModelData = PipelineRunAfterNodeModelData & {
  clusterResolverTaskList: TaskKind[];
  namespaceTaskList: TaskKind[];
  onNewTask: NewTaskNodeCallback;
  onRemoveTask: RemoveListTaskCallback | null;
  onTaskSearch: TaskSearchCallback;
};
export type BuilderNodeModelData = PipelineRunAfterNodeModelData & {
  error?: string;
  task: PipelineTask;
  onAddNode: NewTaskListNodeCallback;
  onNodeSelection: NodeSelectionCallback;
};
export type SpacerNodeModelData = PipelineRunAfterNodeModelData & {};
export type TaskNodeModelData = PipelineRunAfterNodeModelData & {
  task: PipelineTask;
  pipeline?: PipelineKind;
  pipelineRun?: PipelineRunKind;
};

export type CheckTaskErrorMessage = (taskIndex: number) => string | null;

// Graph Models
type PipelineNodeModel<D extends PipelineRunAfterNodeModelData> = NodeModel & {
  data: D;
  type: NodeType;
};
export type PipelineMixedNodeModel =
  PipelineNodeModel<PipelineRunAfterNodeModelData>;
export type PipelineTaskNodeModel = PipelineNodeModel<TaskNodeModelData>;
export type PipelineBuilderTaskNodeModel =
  PipelineNodeModel<BuilderNodeModelData>;
export type PipelineTaskListNodeModel =
  PipelineNodeModel<TaskListNodeModelData>;
export type PipelineTaskLoadingNodeModel = PipelineNodeModel<LoadingNodeModel>;
export type PipelineFinallyNodeModel = PipelineNodeModel<FinallyNodeModel>;
export type PipelineBuilderFinallyNodeModel =
  PipelineNodeModel<BuilderFinallyNodeModel>;

export type PipelineEdgeModel = EdgeModel;

// Node Creators
export type NodeCreator<D extends PipelineRunAfterNodeModelData> = (
  name: string,
  data: D,
) => PipelineNodeModel<D>;
export type NodeCreatorSetup = (
  type: NodeType,
  width?: number,
  height?: number,
) => NodeCreator<PipelineRunAfterNodeModelData>;

export type DiamondStateType = {
  tooltipContent: string;
  diamondColor: string;
};
