import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import {
  AccessReviewResourceAttributes,
  useAccessReview,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { getLatestPipelineRunStatus } from '../../../components/utils/pipeline-utils';
import {
  getTaskRunsOfPipelineRun,
  useTaskRunsK8s,
} from '../../../components/hooks/useTaskRuns';
import Status from '../../../components/status/Status';
import { PipelineRunModel } from '../../../models';
import { resourcePathFromModel } from '../../../components/utils/utils';
import { startPipelineModal } from '../../../components/start-pipeline';
import { PipelineKind, PipelineRunKind } from '../../../types';
import BuildDecoratorBubble from '../BuildDecoratorBubble';
import PipelineBuildDecoratorTooltip from './PipelineBuildDecoratorTooltip';
import { t } from '../../utils/common-utils';

type PipelineRunDecoratorProps = {
  pipeline: PipelineKind;
  pipelineRuns: PipelineRunKind[];
  radius: number;
  x: number;
  y: number;
};

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

export const ConnectedPipelineRunDecorator: React.FC<
  PipelineRunDecoratorProps & StateProps
> = ({ pipeline, pipelineRuns, radius, x, y, impersonate }) => {
  const ref = React.useRef();
  const launchModal = useModal();

  const { latestPipelineRun, status } =
    getLatestPipelineRunStatus(pipelineRuns);
  const [taskRuns, taskRunsLoaded] = useTaskRunsK8s(
    latestPipelineRun?.metadata?.namespace,
  );

  const PLRTaskRuns = getTaskRunsOfPipelineRun(
    taskRuns,
    latestPipelineRun?.metadata?.name,
  );
  const statusIcon = <Status status={status} iconOnly noTooltip />;

  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace: pipeline.metadata.namespace,
    verb: 'create',
  };
  const canStartPipeline = useAccessReview(defaultAccessReview, impersonate);

  let ariaLabel;
  let tooltipContent;
  let decoratorContent;
  if (latestPipelineRun) {
    ariaLabel = t(`Pipeline status is {{status}}. View logs.`, { status });
    tooltipContent = taskRunsLoaded && (
      <PipelineBuildDecoratorTooltip
        pipelineRun={latestPipelineRun}
        status={status}
        taskRuns={PLRTaskRuns}
      />
    );

    const link = `${resourcePathFromModel(
      PipelineRunModel,
      latestPipelineRun.metadata.name,
      latestPipelineRun.metadata.namespace,
    )}/logs`;
    decoratorContent = (
      <Link to={link}>
        <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={ariaLabel}>
          {statusIcon}
        </BuildDecoratorBubble>
      </Link>
    );
  } else {
    ariaLabel = t('Pipeline not started. Start pipeline.');
    tooltipContent = t('Pipeline not started');

    let onClick = null;
    if (canStartPipeline) {
      onClick = () => {
        launchModal(startPipelineModal, {
          pipeline,
        });
      };
    }

    decoratorContent = (
      <BuildDecoratorBubble
        x={x}
        y={y}
        radius={radius}
        onClick={onClick}
        ariaLabel={ariaLabel}
      >
        {statusIcon}
      </BuildDecoratorBubble>
    );
  }

  return (
    <Tooltip
      triggerRef={ref}
      content={tooltipContent}
      position={TooltipPosition.left}
    >
      <g ref={ref} data-test="PipelineRunDecorator">
        {decoratorContent}
      </g>
    </Tooltip>
  );
};

export default ConnectedPipelineRunDecorator;
