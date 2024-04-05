import { BreadcrumbItem, Text, TextVariants } from '@patternfly/react-core';
import { Link, useHistory } from 'react-router-dom';
import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useK8sWatchResource,
  useLabelsModal,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel, PipelineRunModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import { navFactory } from '../utils/horizontal-nav';
import ResourceYAMLEditorTab from '../yaml-editor/ResourceYAMLEditorTab';
import PipelineDetails from './PipelineDetails';
import { PipelineKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import PipelineParamatersTab from './PipelineParamatersTab';
import PipelineRuns from '../pipelineRuns-list/PipelineRuns';
import { useLatestPipelineRun } from '../hooks/hooks';
import { rerunPipelineAndRedirect } from '../utils/pipelines-actions';

const PipelineDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const history = useHistory();
  const { name, ns: namespace } = params;
  const [data, loaded] = useK8sWatchResource<PipelineKind>({
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    name,
  });
  const launchModal = useModal();
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const launchAnnotationsModal = useAnnotationsModal(data);
  const launchLabelsModal = useLabelsModal(data);
  const launchDeleteModal = useDeleteModal(data);

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

  const editURL = namespace
    ? `/k8s/ns/${namespace}/${getReferenceForModel(
        PipelineModel,
      )}/${encodeURIComponent(name)}/yaml`
    : `/k8s/cluster/${getReferenceForModel(PipelineModel)}/${encodeURIComponent(
        name,
      )}/yaml`;

  const resourceTitleFunc = React.useMemo(() => {
    return <div className="Pipeline-details-page">{data?.metadata?.name} </div>;
  }, [data]);

  if (!loaded) {
    return <LoadingBox />;
  }
  return (
    <DetailsPage
      obj={data}
      headTitle={name}
      title={<Text component={TextVariants.h1}>{resourceTitleFunc}</Text>}
      model={PipelineModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v5-c-breadcrumb__link"
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
          href: 'Runs',
          name: t('PipelineRuns'),
          component: PipelineRuns,
        },
        {
          href: 'parameters',
          name: t('Parameters'),
          component: PipelineParamatersTab,
        },
      ]}
      actions={[
        {
          key: 'start-last-run',
          label: latestPipelineRun ? t('Start last run') : null,
          onClick: () =>
            rerunPipelineAndRedirect(
              PipelineRunModel,
              latestPipelineRun,
              launchModal,
            ),
          disabled: !canEditResource[0],
        },
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
          onClick: () => history.push(editURL),
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
