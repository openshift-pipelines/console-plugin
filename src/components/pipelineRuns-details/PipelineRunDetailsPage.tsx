import {
  k8sCreate,
  k8sPatch,
  ResourceStatus,
  useDeleteModal,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { PipelineRunModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import {
  BreadcrumbItem,
  Text,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
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
import { returnValidPipelineRunModel } from '../utils/pipeline-utils';
import { getPipelineRunData, resourcePathFromModel } from '../utils/utils';
import { errorModal } from '../modals/error-modal';
import {
  isResourceLoadedFromTR,
  tektonResultsFlag,
} from '../utils/common-utils';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  shouldHidePipelineRunCancel,
  shouldHidePipelineRunStop,
} from '../utils/pipeline-augment';
import {
  getTaskRunsOfPipelineRun,
  usePipelineRun,
  useTaskRuns,
} from '../hooks/useTaskRuns';

type PipelineRunDetailsPageProps = {
  name: string;
  namespace: string;
};

const PipelineRunDetailsPage: React.FC<PipelineRunDetailsPageProps> = ({
  name,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const [pipelineRun, pipelineRunLoaded] = usePipelineRun(namespace, name);
  const [taskRuns] = useTaskRuns(namespace, name);
  const PLRTasks = getTaskRunsOfPipelineRun(taskRuns, name);
  const reRunAction = () => {
    const { pipelineRef, pipelineSpec } = pipelineRun.spec;
    if (
      namespace &&
      (pipelineRef?.name || pipelineSpec || pipelineRef?.resolver)
    ) {
      k8sCreate({
        model: returnValidPipelineRunModel(pipelineRun),
        data: getPipelineRunData(null, pipelineRun),
      }).then((plr) => {
        navigate(
          resourcePathFromModel(
            PipelineRunModel,
            plr.metadata.name,
            plr.metadata.namespace,
          ),
        );
      });
    } else {
      errorModal({
        error: t(
          'Invalid PipelineRun configuration, unable to start Pipeline.',
        ),
      });
    }
  };

  const cancelAction = () => {
    k8sPatch({
      model: PipelineRunModel,
      resource: {
        metadata: {
          name,
          namespace,
        },
      },
      data: [
        {
          op: 'replace',
          path: `/spec/status`,
          value: 'CancelledRunFinally',
        },
      ],
    });
  };

  const stopAction = () => {
    k8sPatch({
      model: PipelineRunModel,
      resource: {
        metadata: { name, namespace },
      },
      data: [
        {
          op: 'replace',
          path: `/spec/status`,
          value: 'StoppedRunFinally',
        },
      ],
    });
  };

  const message = (
    <p>
      {t(
        'This action will delete resource from k8s but still the resource can be fetched from Tekton Results',
      )}
    </p>
  );

  const launchDeleteModal =
    !isResourceLoadedFromTR(pipelineRun) && tektonResultsFlag(pipelineRun)
      ? useDeleteModal(pipelineRun, undefined, message)
      : useDeleteModal(pipelineRun);

  const resourceTitleFunc = React.useMemo((): string | JSX.Element => {
    return (
      <div className="pipelinerun-details-page">
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
      title={<Text component={TextVariants.h1}>{resourceTitleFunc}</Text>}
      model={PipelineRunModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v5-c-breadcrumb__link"
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
      actions={[
        {
          key: 'rerun-pipelineRun',
          label: t('Rerun'),
          onClick: () => reRunAction(),
        },
        {
          key: 'stop-pipelineRun',
          label: t('Stop'),
          tooltipProps: {
            content: t(
              'Let the running tasks complete, then execute finally tasks',
            ),
          },
          onClick: () => stopAction(),
          hidden: shouldHidePipelineRunStop(pipelineRun, PLRTasks),
        },
        {
          key: 'cancel-pipelineRun',
          label: 'Cancel',
          tooltipProps: {
            content: t(
              'Interrupt any executing non finally tasks, then execute finally tasks',
            ),
          },
          onClick: () => cancelAction(),
          hidden: shouldHidePipelineRunCancel(pipelineRun, PLRTasks),
        },
        {
          key: 'delete-pipelineRun',
          label: t('Delete PipelineRun'),
          onClick: () => launchDeleteModal(),
          isDisabled: isResourceLoadedFromTR(pipelineRun),
        },
      ]}
    />
  );
};

export default PipelineRunDetailsPage;
