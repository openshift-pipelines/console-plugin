import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, RouteComponentProps } from 'react-router-dom';
import { PipelineModel } from '../../models';
import { PipelineKind } from '../../types';
import PipelineBuilderPage from './PipelineBuilderPage';

import './PipelineBuilderEditPage.scss';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { LoadingBox } from '../status/status-box';
import { k8sGet } from '@openshift-console/dynamic-plugin-sdk';

type PipelineBuilderEditPageProps = RouteComponentProps<{
  ns: string;
  pipelineName: string;
}>;

const PipelineBuilderEditPage: React.FC<PipelineBuilderEditPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  const [editPipeline, setEditPipeline] = React.useState<PipelineKind>(null);
  const [error, setError] = React.useState<string>(null);
  const {
    match: {
      params: { pipelineName, ns },
    },
  } = props;

  React.useEffect(() => {
    k8sGet({ model: PipelineModel, name: pipelineName, ns })
      .then((res: PipelineKind) => {
        setEditPipeline(res);
      })
      .catch(() => {
        setError(t('pipelines-plugin~Unable to load Pipeline'));
      });
  }, [pipelineName, ns, t]);

  if (error) {
    // TODO: confirm verbiage with UX
    return (
      <div className="odc-pipeline-builder-edit-page">
        <Alert variant="danger" isInline title={error}>
          {t('pipelines-plugin~Navigate back to the')}{' '}
          <Link to={`/k8s/ns/${ns}/${getReferenceForModel(PipelineModel)}`}>
            {t('pipelines-plugin~Pipelines page')}
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
