import type { FunctionComponent } from 'react';
import { useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@patternfly/react-core';
import {
  DEFAULT_LAYER,
  DEFAULT_WHEN_OFFSET,
  Layer,
  Node,
  ScaleDetailsLevel,
  TaskNode,
  TOP_LAYER,
  useDetailsLevel,
  useHover,
  WhenDecorator,
  WithContextMenuProps,
  WithSelectionProps,
  observer,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { Link } from 'react-router';
import { NodeType } from './const';
import { PipelineModel, PipelineRunModel, TaskModel } from '../../models';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  ComputedStatus,
  TaskKind,
  PipelineKind,
  PipelineTask,
} from '../../types';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';
import {
  createStepStatus,
  StepStatus,
} from '../pipelines-details/pipeline-step-utils';
import { PipelineVisualizationStepList } from '../pipelines-details/PipelineVisualizationStepList';
import { resourcePathFromModel } from '../utils/utils';
import { getTooltipContent } from './utils';
import './PipelineTaskNode.scss';

type PipelineTaskNodeProps = {
  element: Node;
} & WithContextMenuProps &
  WithSelectionProps;

const getResource = (
  ref: PipelineTask['pipelineRef'] | PipelineTask['taskRef'],
  ns: string,
  model: typeof TaskModel | typeof PipelineModel,
  prop: 'task' | 'pipeline',
) => {
  if (!ref) return undefined;
  if (ref.resolver === 'cluster') {
    const resourceName = ref?.params?.find(
      (param) => param.name === 'name',
    )?.value;
    const resourceNamespace = ref?.params?.find(
      (param) => param.name === 'namespace',
    )?.value;

    return {
      kind: getReferenceForModel(model),
      name: resourceName,
      namespace: resourceNamespace || ns,
      prop,
    };
  }
  return {
    kind: getReferenceForModel(model),
    name: ref.name,
    namespace: ns,
    prop,
  };
};

const PipelineTaskNode: FunctionComponent<PipelineTaskNodeProps> = ({
  element,
  onContextMenu,
  contextMenuOpen,
  ...rest
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const data = element.getData();
  const ns = data.pipeline.metadata.namespace;

  const [hover, hoverRef] = useHover();
  const taskRef = useRef();
  const detailsLevel = useDetailsLevel();
  const isFinallyTask = element.getType() === NodeType.FINALLY_NODE;
  const isPipelineTask = !!data.task?.pipelineRef;

  const resources = isPipelineTask
    ? getResource(data.task?.pipelineRef, ns, PipelineModel, 'pipeline')
    : getResource(data.task?.taskRef, ns, TaskModel, 'task');

  //const resources = getResource(data.task?.taskRef, ns, TaskModel, 'task');

  const [resource] = useK8sWatchResource<TaskKind | PipelineKind>(resources);

  const computedTask = isPipelineTask
    ? data.task
    : resource && Object.keys(resource).length
    ? (resource as TaskKind)
    : data.task;
  const stepList =
    computedTask?.status?.steps ||
    computedTask?.spec?.steps ||
    computedTask?.taskSpec?.steps ||
    [];

  const childPipelineTasks = isPipelineTask
    ? (resource as PipelineKind)?.spec?.tasks
    : undefined;

  const pipelineRunStatus =
    data.pipelineRun && pipelineRunFilterReducer(data.pipelineRun);
  const isSkipped = !!(
    computedTask &&
    data.pipelineRun?.status?.skippedTasks?.some(
      (t) => t.name === data.task.name,
      (t) => t.name === computedTask.name,
    )
  );

  const taskStatus = data.task?.status || {
    duration: '',
    reason: ComputedStatus.Idle,
  };
  if (
    pipelineRunStatus === ComputedStatus.Failed ||
    pipelineRunStatus === ComputedStatus.Cancelled
  ) {
    if (
      data.task?.status?.reason === ComputedStatus.Idle ||
      data.task?.status?.reason === ComputedStatus.Pending
    ) {
      taskStatus.reason = ComputedStatus.Cancelled;
    }
  }
  if (isSkipped) {
    taskStatus.reason = ComputedStatus.Skipped;
  }

  const stepStatusList: StepStatus[] = stepList.map((step) =>
    createStepStatus(step, taskStatus),
  );
  const { pipelineRun } = data;
  const succeededStepsCount = stepStatusList.filter(
    ({ status }) => status === ComputedStatus.Succeeded,
  ).length;

  const statusBadge =
    stepStatusList.length > 0 && data.status
      ? `${succeededStepsCount}/${stepStatusList.length}`
      : null;

  const passedData = useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach((key) => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  const kindModel = isPipelineTask ? PipelineModel : TaskModel;
  const hasTaskIcon = !!(data.taskIconClass || data.taskIcon);
  const tooltipContent = getTooltipContent(data.task?.status?.reason, t);
  const whenDecorator = data.whenStatus ? (
    <WhenDecorator
      element={element}
      status={data.whenStatus}
      leftOffset={
        hasTaskIcon
          ? DEFAULT_WHEN_OFFSET + (element.getBounds().height - 4) * 0.75
          : DEFAULT_WHEN_OFFSET
      }
      toolTip={tooltipContent}
    />
  ) : null;

  // eslint-disable-next-line no-unsafe-optional-chaining
  const { name: plrName, namespace } = pipelineRun?.metadata;
  const path = plrName
    ? `${resourcePathFromModel(
        PipelineRunModel,
        plrName,
        namespace,
      )}/logs?taskName=${element.getLabel()}`
    : undefined;

  const enableLogLink =
    data.status !== ComputedStatus.Idle &&
    data.status !== ComputedStatus.Pending &&
    data.status !== ComputedStatus.Cancelled &&
    data.status !== ComputedStatus.Skipped &&
    !!path;

  const taskNode = (
    <TaskNode
      badge={
        kindModel === TaskModel && statusBadge
          ? `${kindModel.abbr} ${statusBadge}`
          : kindModel.abbr
      }
      className="odc-pipeline-topology__task-node"
      element={element}
      onContextMenu={data.showContextMenu ? onContextMenu : undefined}
      contextMenuOpen={contextMenuOpen}
      scaleNode={
        (hover || contextMenuOpen) && detailsLevel !== ScaleDetailsLevel.high
      }
      hideDetailsAtMedium
      {...passedData}
      {...rest}
      truncateLength={element.getData()?.label?.length}
    >
      {whenDecorator}
    </TaskNode>
  );

  const classes = classNames('odc-pipeline-topology__task-node', {
    'is-link': enableLogLink,
  });
  return (
    <Layer
      id={
        detailsLevel !== ScaleDetailsLevel.high && (hover || contextMenuOpen)
          ? TOP_LAYER
          : DEFAULT_LAYER
      }
    >
      <g
        data-test={`task ${element.getLabel()}`}
        className={classes}
        ref={hoverRef}
      >
        <Tooltip
          enableFlip={true}
          triggerRef={taskRef}
          content={
            <PipelineVisualizationStepList
              isSpecOverview={!data.status}
              taskName={element.getLabel()}
              steps={
                kindModel === PipelineModel
                  ? childPipelineTasks
                  : stepStatusList
              }
              isFinallyTask={isFinallyTask}
            />
          }
        >
          <g ref={taskRef}>
            {enableLogLink ? <Link to={path}>{taskNode}</Link> : taskNode}
          </g>
        </Tooltip>
      </g>
    </Layer>
  );
};

export default observer(PipelineTaskNode);
