import * as React from 'react';
import { Button } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  AccessReviewResourceAttributes,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import { returnValidPipelineRunModel } from '../utils/pipeline-utils';
import { getLatestRun } from '../utils/pipeline-augment';
import { PipelineRunKind } from '../../types';
import {
  useGetActiveUser,
  usePipelineRunWithUserAnnotation,
} from '../hooks/hooks';
import { rerunPipelineAndStay } from '../utils/pipelines-actions';

type TriggerLastRunButtonProps = {
  pipelineRuns: PipelineRunKind[];
  namespace: string;
  impersonate?;
};

const TriggerLastRunButton: React.FC<TriggerLastRunButtonProps> = ({
  pipelineRuns,
  namespace,
  impersonate,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const currentUser = useGetActiveUser();
  const latestRun = usePipelineRunWithUserAnnotation(
    getLatestRun(pipelineRuns, 'startTimestamp'),
  );
  const pipelineRunModel = returnValidPipelineRunModel(latestRun);
  const {
    labelKey,
    callback,
    accessReview: utilityAccessReview,
  } = rerunPipelineAndStay(pipelineRunModel, latestRun, currentUser);
  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace,
    verb: 'create',
  };
  const accessReview = _.isEmpty(utilityAccessReview)
    ? defaultAccessReview
    : utilityAccessReview;
  const isAllowed = useAccessReview(accessReview, impersonate);
  return (
    isAllowed && (
      <Button
        variant="secondary"
        onClick={callback}
        isDisabled={pipelineRuns.length === 0 && !callback}
      >
        {t(labelKey)}
      </Button>
    )
  );
};

export default TriggerLastRunButton;
