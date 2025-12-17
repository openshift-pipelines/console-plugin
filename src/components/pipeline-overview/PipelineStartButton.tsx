import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineKind } from '../../types';
import {
  AccessReviewResourceAttributes,
  useAccessReview,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import { startPipelineModal } from '../start-pipeline';

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

type PipelineStartButtonProps = {
  pipeline: PipelineKind;
  namespace: string;
};

const PipelineStartButton: React.FC<PipelineStartButtonProps & StateProps> = ({
  pipeline,
  namespace,
  impersonate,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const launchModal = useOverlay();

  const openPipelineModal = () => {
    launchModal(startPipelineModal, {
      pipeline,
    });
  };
  const defaultAccessReview: AccessReviewResourceAttributes = {
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    namespace,
    verb: 'create',
  };
  const isAllowed = useAccessReview(defaultAccessReview, impersonate);

  return (
    isAllowed && (
      <Button variant="secondary" onClick={openPipelineModal}>
        {t('Start')}
      </Button>
    )
  );
};

export default PipelineStartButton;
