import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom-v5-compat';
import { PipelineModel } from '../../models';
import { PipelineKind } from '../../types';
import PipelineBuilderPage from './PipelineBuilderPage';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { LoadingBox } from '../status/status-box';
import { k8sGet } from '@openshift-console/dynamic-plugin-sdk';

import './PipelineBuilderEditPage.scss';

const PipelineBuilderEditPage: React.FC = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [editPipeline, setEditPipeline] = React.useState<PipelineKind>(null);
  const [error, setError] = React.useState<string>(null);
  const { ns, pipelineName } = useParams();

  React.useEffect(() => {
    k8sGet({ model: PipelineModel, name: pipelineName, ns })
      .then((res: PipelineKind) => {
        setEditPipeline(res);
      })
      .catch(() => {
        setError(t('Unable to load Pipeline'));
      });
  }, [pipelineName, ns, t]);

  if (error) {
    // TODO: confirm verbiage with UX
    return (
      <div className="odc-pipeline-builder-edit-page">
        <Alert variant="danger" isInline title={error}>
          {t('Navigate back to the')}{' '}
          <Link to={`/k8s/ns/${ns}/${getReferenceForModel(PipelineModel)}`}>
            {t('Pipelines page')}
          </Link>
          .
        </Alert>
      </div>
    );
  }

  if (!editPipeline) {
    return <LoadingBox />;
  }

  return <PipelineBuilderPage {...props} existingPipeline={editPipeline} />;
};

export default PipelineBuilderEditPage;
