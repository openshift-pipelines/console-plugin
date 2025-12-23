import { ResourceStatus } from '@openshift-console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ActionMenuVariant } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import * as React from 'react';
import { PipelineRunModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import {
  BreadcrumbItem,
  Content,
  ContentVariants,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { navFactory } from '../utils/horizontal-nav';
import PipelineRunDetails from './PipelineRunDetails';
import ResourceYAMLEditorViewOnly from '../yaml-editor/ResourceYAMLEditorViewOnly';
import {
  chainsSignedAnnotation,
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../consts';
import { ArchiveIcon } from '@patternfly/react-icons';
import SignedBadgeIcon from '../../images/SignedBadge';
import Status from '../status/Status';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import PipelineRunParametersForm from './PipelineRunParametersForm';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';
import PipelineRunEvents from './PipelineRunEvents';
import { usePipelineRun } from '../hooks/useTaskRuns';
import { getReferenceForModel } from '../pipelines-overview/utils';

type PipelineRunDetailsPageProps = {
  name: string;
  namespace: string;
};

const PipelineRunDetailsPage: React.FC<PipelineRunDetailsPageProps> = ({
  name,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [pipelineRun, pipelineRunLoaded] = usePipelineRun(namespace, name);

  const customActionMenu = React.useCallback((_kindObj, obj) => {
    const reference = getReferenceForModel(PipelineRunModel);
    const context = { [reference]: obj };
    return (
      <LazyActionMenu
        context={context}
        variant={ActionMenuVariant.DROPDOWN}
        label={t('Actions')}
      />
    );
  }, []);

  const resourceTitleFunc = React.useMemo((): string | JSX.Element => {
    return (
      <div className="pipelinerun-details-page pf-v6-l-flex pf-m-row pf-m-gap-sm">
        {pipelineRun?.metadata?.name}{' '}
        {pipelineRun?.metadata?.annotations?.[chainsSignedAnnotation] ===
          'true' && (
          <Tooltip content={t('Signed')}>
            <div className="opp-pipeline-run-details__signed-indicator">
              <SignedBadgeIcon width="18" height="18" />
            </div>
          </Tooltip>
        )}
        {(pipelineRun?.metadata?.annotations?.[
          DELETED_RESOURCE_IN_K8S_ANNOTATION
        ] === 'true' ||
          pipelineRun?.metadata?.annotations?.[
            RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
          ] === 'true') && (
          <Tooltip content={t('Archived in Tekton results')}>
            <ArchiveIcon className="pipelinerun-details-page__results-indicator" />
          </Tooltip>
        )}
        <ResourceStatus>
          <Status
            status={pipelineRunFilterReducer(pipelineRun)}
            title={pipelineRunTitleFilterReducer(pipelineRun)}
          />
        </ResourceStatus>
      </div>
    );
  }, [pipelineRun]);
  if (!pipelineRunLoaded) {
    return <LoadingBox />;
  }
  return (
    <DetailsPage
      obj={pipelineRun}
      headTitle={name}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      model={PipelineRunModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v6-c-breadcrumb__link"
            to={`/pipelines/ns/${namespace}/pipeline-runs`}
          >
            {t('PipelineRuns')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/pipelines/ns/${namespace}/`,
          name: t('PipelineRun details'),
        },
      ]}
      pages={[
        navFactory.details(PipelineRunDetails),
        navFactory.editYaml(ResourceYAMLEditorViewOnly),
        {
          href: 'parameters',
          name: t('Parameters'),
          component: (pageProps) => (
            <PipelineRunParametersForm obj={pipelineRun} {...pageProps} />
          ),
        },
        {
          href: 'logs',
          name: t('Logs'),
          component: PipelineRunLogsWithActiveTask,
        },
        navFactory.events(PipelineRunEvents),
      ]}
      customActionMenu={customActionMenu}
    />
  );
};

export default PipelineRunDetailsPage;
