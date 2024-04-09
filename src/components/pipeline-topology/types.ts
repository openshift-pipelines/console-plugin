import {
  EdgeModel,
  NodeModel,
  RunStatus,
  WhenStatus,
} from '@patternfly/react-topology';

import {
  K8sResourceCommon,
  K8sVerb,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  PipelineKind,
  PipelineRunKind,
  PipelineTask,
  TaskKind,
} from '../../types';
import {
  PipelineBuilderLoadingTask,
  TaskSearchCallback,
} from '../pipelines-details/types';
import { AddNodeDirection, NodeType } from './const';

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
  clusterTaskList: TaskKind[];
  namespaceTaskList: TaskKind[];
  namespace: string;
  isFinallyTask: boolean;
};

export type TaskListNodeModelData = PipelineRunAfterNodeModelData & {
  clusterTaskList: TaskKind[];
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

export enum ApprovalStatus {
  Idle = 'idle',
  RequestSent = 'wait',
  PartiallyApproved = 'partiallyApproved',
  AlmostApproved = 'almostApproved',
  Accepted = 'true',
  Rejected = 'false',
  TimedOut = 'timeout',
  Unknown = 'unknown',
}

export enum CustomRunStatus {
  RunCancelled = 'RunCancelled',
}

export type CustomRunKind = K8sResourceCommon & {
  spec: {
    customRef: {
      apiVersion: string;
      kind: string;
    };
    serviceAccountName?: string;
    status?: CustomRunStatus;
    statusMessage?: string;
  };
};

export type ApprovalTaskKind = K8sResourceCommon & {
  spec?: {
    approvals: {
      input: string;
      message: string;
      name: string;
    }[];
    approvalsRequired: number;
  };
  status?: {
    approvalState: string;
    approvals: string[];
    approvedBy: {
      name: string;
      approved: string;
    }[];
  };
};

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

export type KebabOption = {
  hidden?: boolean;
  label?: React.ReactNode;
  labelKey?: string;
  labelKind?: { [key: string]: string | string[] };
  href?: string;
  callback?: () => any;
  accessReview?: AccessReviewResourceAttributes;
  isDisabled?: boolean;
  tooltip?: string;
  tooltipKey?: string;
  // a `/` separated string where each segment denotes a new sub menu entry
  // Eg. `Menu 1/Menu 2/Menu 3`
  path?: string;
  pathKey?: string;
  icon?: React.ReactNode;
};
