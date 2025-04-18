import {
  DagreLayout,
  EdgeModel,
  Graph,
  GraphModel,
  LayoutFactory,
  ModelKind,
  PipelineDagreLayout,
  RunStatus,
  WhenStatus,
  getEdgesFromNodes,
  getSpacerNodes,
} from '@patternfly/react-topology';
import * as _ from 'lodash';
import {
  PipelineKind,
  PipelineRunKind,
  PipelineTask,
  PipelineTaskWithStatus,
  TaskRunKind,
} from '../../types';
import {
  appendPipelineRunStatus,
  getPipelineTasks,
} from '../utils/pipeline-utils';
import {
  AddNodeDirection,
  DAGRE_BUILDER_PROPS,
  DAGRE_BUILDER_SPACED_PROPS,
  DAGRE_VIEWER_PROPS,
  DAGRE_VIEWER_SPACED_PROPS,
  DEFAULT_BADGE_WIDTH,
  DEFAULT_FINALLLY_GROUP_PADDING,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_ICON_WIDTH,
  FINALLY_NODE_PADDING,
  FINALLY_NODE_VERTICAL_SPACING,
  NODE_HEIGHT,
  NODE_PADDING,
  NODE_WIDTH,
  NodeType,
  PipelineLayout,
  WHEN_EXPRESSION_SPACING,
} from './const';
import { DAG, Vertex } from './dag';
import {
  BuilderNodeModelData,
  CheckTaskErrorMessage,
  FinallyNodeModel,
  LoadingNodeModel,
  NodeCreator,
  NodeCreatorSetup,
  PipelineEdgeModel,
  PipelineMixedNodeModel,
  PipelineRunAfterNodeModelData,
  PipelineTaskNodeModel,
  SpacerNodeModelData,
  TaskListNodeModelData,
  TaskNodeModelData,
} from './types';

const createGenericNode: NodeCreatorSetup =
  (type, width?, height?) => (name, data) => ({
    id: name,
    label: data?.label || name,
    runAfterTasks: data?.runAfterTasks || [],
    ...(data && { data }),
    height: height ?? NODE_HEIGHT,
    width: width ?? NODE_WIDTH,
    type,
  });

// Node variations
export const createTaskNode: NodeCreator<TaskNodeModelData> = createGenericNode(
  NodeType.TASK_NODE,
);

export const createCustomTaskNode: NodeCreator<TaskNodeModelData> =
  createGenericNode(NodeType.CUSTOM_TASK_NODE);

export const createApprovalTaskNode: NodeCreator<TaskNodeModelData> =
  createGenericNode(NodeType.APPROVAL_TASK_NODE);
export const createSpacerNode: NodeCreator<SpacerNodeModelData> =
  createGenericNode(NodeType.SPACER_NODE, 0);
export const createTaskListNode: NodeCreator<TaskListNodeModelData> =
  createGenericNode(NodeType.TASK_LIST_NODE);
export const createInvalidTaskListNode: NodeCreator<TaskListNodeModelData> =
  createGenericNode(NodeType.INVALID_TASK_LIST_NODE);
export const createBuilderNode: NodeCreator<BuilderNodeModelData> =
  createGenericNode(NodeType.BUILDER_NODE);

export const createFinallyNode = (height): NodeCreator<FinallyNodeModel> =>
  createGenericNode(
    NodeType.FINALLY_NODE,
    NODE_WIDTH + WHEN_EXPRESSION_SPACING + FINALLY_NODE_PADDING * 2,
    height,
  );

export const createLoadingNode: NodeCreator<LoadingNodeModel> =
  createGenericNode(NodeType.LOADING_NODE);

const createPipelineTaskNode = (
  type: NodeType,
  data: PipelineRunAfterNodeModelData,
) => createGenericNode(type, data.width, data.height)(data.id, data);

export const getNodeCreator = (
  type: NodeType,
): NodeCreator<PipelineRunAfterNodeModelData> => {
  switch (type) {
    case NodeType.TASK_LIST_NODE:
      return createTaskListNode;
    case NodeType.BUILDER_NODE:
      return createBuilderNode;
    case NodeType.SPACER_NODE:
      return createSpacerNode;
    case NodeType.LOADING_NODE:
      return createLoadingNode;
    case NodeType.INVALID_TASK_LIST_NODE:
      return createInvalidTaskListNode;
    case NodeType.CUSTOM_TASK_NODE:
      return createCustomTaskNode;
    case NodeType.APPROVAL_TASK_NODE:
      return createApprovalTaskNode;
    case NodeType.TASK_NODE:
    default:
      return createTaskNode;
  }
};

export const handleParallelToParallelNodes = (
  nodes: PipelineMixedNodeModel[],
): PipelineMixedNodeModel[] => {
  type ParallelNodeReference = {
    node: PipelineTaskNodeModel;
    runAfter: string[];
    atIndex: number;
  };
  type ParallelNodeMap = {
    [id: string]: ParallelNodeReference[];
  };

  // Collect only multiple run-afters
  const multipleRunBeforeMap: ParallelNodeMap = nodes.reduce(
    (acc, node, idx) => {
      const {
        data: {
          task: { runAfter },
        },
      } = node;
      if (runAfter && runAfter.length > 1) {
        const id: string = [...runAfter]
          .sort((a, b) => a.localeCompare(b))
          .reduce((str, ref) => `${str}|${ref}`);

        if (!Array.isArray(acc[id])) {
          acc[id] = [];
        }
        acc[id].push({
          node,
          runAfter,
          atIndex: idx,
        });
      }
      return acc;
    },
    {} as ParallelNodeMap,
  );

  // Trim out single occurrences
  const multiParallelToParallelList: ParallelNodeReference[][] = Object.values(
    multipleRunBeforeMap,
  ).filter((data: ParallelNodeReference[]) => data.length > 1);

  if (multiParallelToParallelList.length === 0) {
    // No parallel to parallel
    return nodes;
  }

  // Insert a spacer node between the multiple nodes on the sides of a parallel-to-parallel
  const newNodes: PipelineMixedNodeModel[] = [];
  const newRunAfterNodeMap: { [nodeId: string]: string[] } = {};
  multiParallelToParallelList.forEach((p2p: ParallelNodeReference[]) => {
    // All nodes in each array share their runAfters
    const { runAfter } = p2p[0];

    const names: string[] = p2p.map((p2pData) => p2pData.node.id);
    const parallelSpacerName = `parallel-${names.join('-')}`;

    names.forEach((p2pNodeId) => {
      if (!Array.isArray(newRunAfterNodeMap[p2pNodeId])) {
        newRunAfterNodeMap[p2pNodeId] = [];
      }
      newRunAfterNodeMap[p2pNodeId].push(parallelSpacerName);
    });

    newNodes.push(
      createSpacerNode(parallelSpacerName, {
        task: {
          name: parallelSpacerName,
          runAfter,
        },
      }),
    );
  });

  // Update all impacted nodes to point at the spacer node as the spacer points at their original runAfters
  nodes.forEach((node) => {
    const newRunAfters: string[] | undefined = newRunAfterNodeMap[node.id];
    if (newRunAfters && newRunAfters.length > 0) {
      const {
        data: { task },
        type,
      } = node;

      const createNode: NodeCreator<PipelineRunAfterNodeModelData> =
        getNodeCreator(type);

      // Recreate the node with the new runAfter pointing to the spacer node
      newNodes.push(
        createNode(node.id, {
          ...node.data,
          task: {
            ...task,
            runAfter: newRunAfters,
          },
        }),
      );
    } else {
      // Unaffected node, just carry it over
      newNodes.push(node);
    }
  });

  return newNodes;
};

export const tasksToNodes = (
  taskList: PipelineTask[],
  pipeline?: PipelineKind,
  pipelineRun?: PipelineRunKind,
): PipelineMixedNodeModel[] => {
  const nodeList: PipelineTaskNodeModel[] = taskList.map((task) =>
    createTaskNode(task.name, {
      task,
      pipeline,
      pipelineRun,
    }),
  );

  return handleParallelToParallelNodes(nodeList);
};

export const tasksToBuilderNodes = (
  taskList: PipelineTask[],
  onAddNode: (task: PipelineTask, direction: AddNodeDirection) => void,
  onNodeSelection: (task: PipelineTask) => void,
  getError: CheckTaskErrorMessage,
  selectedIds: string[],
): PipelineMixedNodeModel[] => {
  return taskList.map((task, idx) => {
    return createBuilderNode(task.name, {
      error: getError(idx),
      task,
      selected: selectedIds.includes(task.name),
      onNodeSelection: () => {
        onNodeSelection(task);
      },
      onAddNode: (direction: AddNodeDirection) => {
        onAddNode(task, direction);
      },
    });
  });
};

export const getBuilderEdgesFromNodes = (
  nodes: PipelineMixedNodeModel[],
): PipelineEdgeModel[] =>
  _.flatten(
    nodes.map((node) => {
      const {
        data: {
          task: { name: target, runAfter = [] },
        },
      } = node;

      if (runAfter.length === 0) return null;

      return runAfter.map((source) => ({
        id: `${source}~to~${target}`,
        type: 'edge',
        source,
        target,
      }));
    }),
  ).filter((edgeList) => !!edgeList);

export const getFinallyTaskHeight = (
  allTasksLength: number,
  disableBuilder: boolean,
): number => {
  return (
    allTasksLength * NODE_HEIGHT +
    (allTasksLength - 1) * FINALLY_NODE_VERTICAL_SPACING +
    (!disableBuilder ? NODE_HEIGHT + FINALLY_NODE_VERTICAL_SPACING : 0) +
    FINALLY_NODE_PADDING * 2
  );
};

export const getFinallyTaskWidth = (allTasksLength: number): number => {
  const whenExpressionSpacing =
    allTasksLength > 0 ? WHEN_EXPRESSION_SPACING : 0;
  return NODE_WIDTH + FINALLY_NODE_PADDING * 2 + whenExpressionSpacing;
};

export const getTextWidth = (
  text: string,
  font = '0.8rem RedHatText',
): number => {
  if (!text || text.length === 0) {
    return 0;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return text.length;
  }
  context.font = font;
  const { width } = context.measureText(text);
  return width;
};

export const extractDepsFromContextVariables = (contextVariable: string) => {
  const regex = /(?:(?:\$\(tasks.))([a-z0-9_-]+)(?:.results+)(?:[.^\w]+\))/g;
  let matches;
  const deps = [];
  // eslint-disable-next-line no-cond-assign
  while ((matches = regex.exec(contextVariable)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (matches) {
      if (!deps.includes(matches[1])) {
        deps.push(matches[1]);
      }
    }
  }
  return deps;
};

export const getSpacerNode = (
  node: PipelineMixedNodeModel,
): PipelineMixedNodeModel => ({
  ...node,
  height: 1,
  width: 1,
});

export const getWhenStatus = (status: RunStatus): WhenStatus => {
  switch (status) {
    case RunStatus.Succeeded:
    case RunStatus.Failed:
      return WhenStatus.Met;
    case RunStatus.Skipped:
    case RunStatus['In Progress']:
    case RunStatus.Idle:
      return WhenStatus.Unmet;
    default:
      return undefined;
  }
};

export const getTaskWhenStatus = (task: PipelineTaskWithStatus): WhenStatus => {
  if (!task.when) {
    return undefined;
  }
  return getWhenStatus(task.status?.reason);
};

export const getGraphDataModel = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
    spec: {},
  },
  taskRuns: TaskRunKind[],
): {
  graph: GraphModel;
  nodes: PipelineMixedNodeModel[];
  edges: EdgeModel[];
} => {
  if (!pipeline) {
    return null;
  }

  const taskList = _.flatten(getPipelineTasks(pipeline, pipelineRun, taskRuns));

  const dag = new DAG();
  taskList?.forEach((task: PipelineTask) => {
    dag.addEdges(task.name, task, '', task.runAfter || []);
  });

  const nodes = [];
  const maxWidthForLevel = {};
  dag.topologicalSort((v: Vertex) => {
    if (!maxWidthForLevel[v.level]) {
      maxWidthForLevel[v.level] = getTextWidth(v.name);
    } else {
      maxWidthForLevel[v.level] = Math.max(
        maxWidthForLevel[v.level],
        getTextWidth(v.name),
      );
    }
  });
  dag.topologicalSort((vertex: Vertex) => {
    const runAfterTasks = [];
    const task = vertex.data;
    const depsFromContextVariables = [];
    if (task.params) {
      task.params.forEach((p) => {
        if (Array.isArray(p.value)) {
          p.value.forEach((paramValue) => {
            depsFromContextVariables.push(
              ...extractDepsFromContextVariables(paramValue),
            );
          });
        } else {
          depsFromContextVariables.push(
            ...extractDepsFromContextVariables(p.value),
          );
        }
      });
    }
    if (task?.when) {
      task.when.forEach(({ input, values }) => {
        if (values) {
          depsFromContextVariables.push(
            ...extractDepsFromContextVariables(input),
          );
          values.forEach((whenValue) => {
            depsFromContextVariables.push(
              ...extractDepsFromContextVariables(whenValue),
            );
          });
        }
      });
    }
    const dependancies = _.uniq([...vertex.dependancyNames]);
    if (dependancies) {
      dependancies.forEach((dep) => {
        const depObj = dag.vertices.get(dep);
        if (
          depObj.level - vertex.level <= 1 ||
          vertex.data.runAfter?.includes(depObj.name)
        ) {
          runAfterTasks.push(dep);
        }
      });
    }
    if (depsFromContextVariables.length > 0) {
      const v = depsFromContextVariables.map((d) => {
        return dag.vertices.get(d);
      });
      const minLevelDep = _.minBy(v, (d) => d.level);
      const nearestDeps = v.filter((v1) => v1.level === minLevelDep.level);
      nearestDeps.forEach((nd) => {
        if (vertex.dependancyNames.includes(nd.name)) {
          if (
            nd.level - vertex.level <= 1 ||
            vertex.dependancyNames.length === 0
          ) {
            runAfterTasks.push(nd.name);
          }
        }
      });
    }
    const badgePadding =
      Object.keys(pipelineRun.spec)?.length > 0 ? DEFAULT_BADGE_WIDTH : 0;
    const isTaskSkipped = pipelineRun?.status?.skippedTasks?.some(
      (t) => t.name === task.name,
    );
    const getNodeType = (taskKind: string) => {
      if (!taskKind || taskKind === 'Task' || taskKind === 'task') {
        return NodeType.TASK_NODE;
      }
      if (taskKind === 'ApprovalTask') {
        return NodeType.APPROVAL_TASK_NODE;
      }
      return NodeType.CUSTOM_TASK_NODE;
    };

    const taskKind =
      task?.taskRef?.resolver === 'cluster'
        ? task?.taskRef?.params?.find((param) => param.name === 'kind')?.value
        : task?.taskRef?.kind;

    nodes.push(
      createPipelineTaskNode(getNodeType(taskKind), {
        id: vertex.name,
        label: vertex.name,
        width:
          maxWidthForLevel[vertex.level] +
          NODE_PADDING * 2 +
          DEFAULT_NODE_ICON_WIDTH +
          badgePadding,
        runAfterTasks,
        status: isTaskSkipped ? RunStatus.Skipped : vertex.data.status?.reason,
        whenStatus: getTaskWhenStatus(vertex.data),
        task: vertex.data,
        pipeline,
        pipelineRun,
      }),
    );
  });

  const finallyTaskList = appendPipelineRunStatus(
    pipeline,
    pipelineRun,
    taskRuns,
    true,
  );

  const maxFinallyNodeName =
    finallyTaskList.sort((a, b) => b.name.length - a.name.length)[0]?.name ||
    '';
  const finallyNodes = finallyTaskList.map((fTask) => {
    const isTaskSkipped = pipelineRun?.status?.skippedTasks?.some(
      (t) => t.name === fTask.name,
    );

    return createPipelineTaskNode(NodeType.FINALLY_NODE, {
      id: fTask.name,
      label: fTask.name,
      width:
        getTextWidth(maxFinallyNodeName) +
        NODE_PADDING * 2 +
        DEFAULT_FINALLLY_GROUP_PADDING * 2,
      height: DEFAULT_NODE_HEIGHT,
      runAfterTasks: [],
      status: isTaskSkipped ? RunStatus.Skipped : fTask.status?.reason,
      whenStatus: getTaskWhenStatus(fTask),
      task: fTask,
      pipeline,
      pipelineRun,
    });
  });

  const finallyGroup = finallyNodes.length
    ? [
        {
          id: 'finally-group-id',
          type: NodeType.FINALLY_GROUP,
          children: finallyNodes.map((n) => n.id),
          group: true,
          style: { padding: DEFAULT_FINALLLY_GROUP_PADDING },
        },
      ]
    : [];
  const spacerNodes: PipelineMixedNodeModel[] = getSpacerNodes(
    [...nodes, ...finallyNodes],
    NodeType.SPACER_NODE,
    [NodeType.FINALLY_NODE],
  ).map(getSpacerNode);

  const edges: PipelineEdgeModel[] = getEdgesFromNodes(
    [...nodes, ...spacerNodes, ...finallyNodes],
    NodeType.SPACER_NODE,
    NodeType.EDGE,
    NodeType.EDGE,
    [NodeType.FINALLY_NODE],
    NodeType.EDGE,
  );

  return {
    graph: {
      id: `${pipelineRun?.metadata?.name || pipeline.metadata.name}-graph`,
      type: ModelKind.graph,
      layout: PipelineLayout.DAGRE_VIEWER,
      scaleExtent: [0.5, 1],
    },
    nodes: [...nodes, ...spacerNodes, ...finallyNodes, ...finallyGroup],
    edges,
  };
};

export const getLayoutData = (layout: PipelineLayout): dagre.GraphLabel => {
  switch (layout) {
    case PipelineLayout.DAGRE_BUILDER:
      return DAGRE_BUILDER_PROPS;
    case PipelineLayout.DAGRE_VIEWER:
      return DAGRE_VIEWER_PROPS;
    case PipelineLayout.DAGRE_VIEWER_SPACED:
      return DAGRE_VIEWER_SPACED_PROPS;
    case PipelineLayout.DAGRE_BUILDER_SPACED:
      return DAGRE_BUILDER_SPACED_PROPS;
    default:
      return null;
  }
};

export const layoutFactory: LayoutFactory = (type: string, graph: Graph) => {
  switch (type) {
    case PipelineLayout.DAGRE_BUILDER:
    case PipelineLayout.DAGRE_BUILDER_SPACED:
      return new DagreLayout(graph, {
        // Hack to get around undesirable defaults
        // TODO: fix this, it's not ideal but it works for now
        linkDistance: 0,
        nodeDistance: 0,
        groupDistance: 0,
        collideDistance: 0,
        simulationSpeed: 0,
        chargeStrength: 0,
        allowDrag: false,
        layoutOnDrag: false,
        ...getLayoutData(type),
      });
    case PipelineLayout.DAGRE_VIEWER:
      return new PipelineDagreLayout(graph, { nodesep: 25 });
    default:
      return undefined;
  }
};
