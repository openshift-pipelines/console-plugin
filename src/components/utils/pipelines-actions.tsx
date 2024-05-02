import { K8sKind, k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import { K8sResourceKind, PipelineRunKind } from '../../types';
import { AccessReviewResourceAttributes } from '../pipeline-topology/types';
import { getPipelineRunData } from './utils';
import _ from 'lodash';
import { returnValidPipelineRunModel } from './pipeline-utils';
import { PipelineRunModel } from '../../models';
import { history } from './router';
import { ModalErrorContent } from '../modals/error-modal';
import { resourcePathFromModel } from './pipelines-utils';

type RerunPipelineData = {
  onComplete?: (pipelineRun: PipelineRunKind) => void;
  labelKey?: string;
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

export type KebabAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  resources?: any,
  customData?: any,
) => KebabOption;

export const handlePipelineRunSubmit = (pipelineRun: PipelineRunKind) => {
  history.push(
    resourcePathFromModel(
      PipelineRunModel,
      pipelineRun.metadata.name,
      pipelineRun.metadata.namespace,
    ),
  );
};

export const rerunPipeline: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  modal?: any,
  customData: RerunPipelineData = {},
) => {
  // t('Start last run')
  const { labelKey = 'Start last run', onComplete } = customData;
  const sharedProps = { labelKey, accessReview: {} };

  if (
    !pipelineRun ||
    !_.has(pipelineRun, 'metadata.name') ||
    !_.has(pipelineRun, 'metadata.namespace')
  ) {
    return sharedProps;
  }

  k8sCreate({
    model: returnValidPipelineRunModel(pipelineRun),
    data: getPipelineRunData(null, pipelineRun),
  })
    .then(typeof onComplete === 'function' ? onComplete : () => {})
    .catch((err) => modal(ModalErrorContent, { error: err.message }));
};

export const rerunPipelineAndRedirect: KebabAction = (
  kind: K8sKind,
  pipelineRun: PipelineRunKind,
  modal?: any,
) => {
  return rerunPipeline(kind, pipelineRun, modal, {
    onComplete: handlePipelineRunSubmit,
    // t('Start last run')
    labelKey: 'Start last run',
  });
};
