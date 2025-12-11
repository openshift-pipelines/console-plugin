import {
  BreadcrumbItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useK8sWatchResource,
  useLabelsModal,
  useModal,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel, PipelineRunModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import { navFactory } from '../utils/horizontal-nav';
import ResourceYAMLEditorTab from '../yaml-editor/ResourceYAMLEditorTab';
import PipelineDetails from './PipelineDetails';
import { PipelineKind, PipelineRunKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import PipelineParamatersTab from './PipelineParamatersTab';
import { useGetActiveUser, useLatestPipelineRun } from '../hooks/hooks';
import { rerunPipeline } from '../utils/pipelines-actions';
import _ from 'lodash';
import {
  AddTriggerModal,
  RemoveTriggerModal,
  startPipelineModal,
} from '../start-pipeline';
import { triggerPipeline } from '../pipelines-list/PipelineKebab';
import { StartedByAnnotation } from '../../consts';
import { usePipelineTriggerTemplateNames } from '../utils/triggers';
import { resourcePathFromModel } from '../utils/utils';
import { ErrorPage404 } from '../common/error';

const PipelineDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const navigate = useNavigate();
  const currentUser = useGetActiveUser();
  const { name, ns: namespace } = params;
  const [pipeline, loaded, loadError] = useK8sWatchResource<PipelineKind>({
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    name,
  });
  const launchModal = useModal();
  const launchOverlay = useOverlay();
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const launchAnnotationsModal = useAnnotationsModal(pipeline);
  const launchLabelsModal = useLabelsModal(pipeline);
  const launchDeleteModal = useDeleteModal(pipeline);
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const canEditResource = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'update',
    name,
    namespace,
  });
  const canDeleteResource = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const editURL = `/k8s/ns/${namespace}/${getReferenceForModel(
    PipelineModel,
  )}/${encodeURIComponent(name)}/builder`;

  const resourceTitleFunc = React.useMemo(() => {
    return (
      <div className="Pipeline-details-page">{pipeline?.metadata?.name} </div>
    );
  }, [pipeline]);

  const handlePipelineRunSubmit = (pipelineRun: PipelineRunKind) => {
    navigate(
      resourcePathFromModel(
        PipelineRunModel,
        pipelineRun.metadata.name,
        pipelineRun.metadata.namespace,
      ),
    );
  };

  const startPipeline = () => {
    const params = _.get(pipeline, ['spec', 'params'], []);
    const resources = _.get(pipeline, ['spec', 'resources'], []);
    const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
      launchOverlay(startPipelineModal, {
        pipeline,
        onSubmit: handlePipelineRunSubmit,
      });
    } else {
      triggerPipeline(pipeline, currentUser, launchOverlay, handlePipelineRunSubmit);
    }
  };

  const rerunPipelineAndRedirect = () => {
    rerunPipeline(
      PipelineRunModel,
      latestPipelineRun,
      currentUser,
      launchModal,
      {
        onComplete: handlePipelineRunSubmit,
      },
    );
  };

  const addTrigger = () => {
    const cleanPipeline: PipelineKind = {
      ...pipeline,
      metadata: {
        ...pipeline.metadata,
        annotations: _.omit(pipeline.metadata.annotations, [
          StartedByAnnotation.user,
        ]),
      },
    };
    launchModal(AddTriggerModal, { pipeline: cleanPipeline });
  };

  const removeTrigger = () => {
    launchModal(RemoveTriggerModal, { pipeline });
  };

  if (!loaded) {
    return loadError ? <ErrorPage404 /> : <LoadingBox />;
  }
  return (
    <DetailsPage
      obj={pipeline}
      headTitle={name}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      model={PipelineModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v6-c-breadcrumb__link"
            to={`/pipelines/ns/${namespace}/`}
          >
            {t('Pipelines')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/pipelines/ns/${namespace}/`,
          name: t('Pipeline details'),
        },
      ]}
      pages={[
        navFactory.details(PipelineDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
        {
          href: 'parameters',
          name: t('Parameters'),
          component: PipelineParamatersTab,
        },
      ]}
      actions={[
        {
          key: 'start-pipeline',
          label: t('Start'),
          onClick: startPipeline,
        },
        ...(latestPipelineRun
          ? [
              {
                key: 'start-last-run',
                label: t('Start last run'),
                onClick: rerunPipelineAndRedirect,
                disabled: !canEditResource[0],
              },
            ]
          : []),
        {
          key: 'add-trigger',
          label: t('Add Trigger'),
          onClick: addTrigger,
        },
        ...(templateNames.length > 0
          ? [
              {
                key: 'remove-trigger',
                label: t('Remove Trigger'),
                onClick: removeTrigger,
              },
            ]
          : []),
        {
          key: 'edit-labels',
          label: t('Edit labels'),
          onClick: () => launchLabelsModal(),
          disabled: !canEditResource[0],
        },
        {
          key: 'edit-annotations',
          label: t('Edit annotations'),
          onClick: () => launchAnnotationsModal(),
          disabled: !canEditResource[0],
        },
        {
          key: 'edit-task',
          label: t('Edit {{resourceKind}}', {
            resourceKind: PipelineModel.kind,
          }),
          onClick: () => navigate(editURL),
          disabled: !canEditResource[0],
        },
        {
          key: 'delete-task',
          label: t('Delete {{resourceKind}}', {
            resourceKind: PipelineModel.kind,
          }),
          onClick: () => launchDeleteModal(),
          disabled: !canDeleteResource[0],
        },
      ]}
    />
  );
};

export default PipelineDetailsPage;
