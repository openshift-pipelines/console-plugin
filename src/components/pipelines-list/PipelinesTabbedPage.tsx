import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  NamespaceBar,
  NavPage,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ApprovalTaskModel,
  PipelineModel,
  PipelineRunModel,
  RepositoryModel,
} from '../../models';
import { RepositoriesList } from '../repositories-list';
import { PipelinesList } from '../pipelines-list';
import { PipelineRunsList } from '../pipelineRuns-list';
import {
  FLAG_OPENSHIFT_PIPELINE_APPROVAL_TASK,
  FLAG_OPENSHIFT_PIPELINE_AS_CODE,
} from '../../consts';
import {
  MenuAction,
  MenuActions,
} from '../multi-tab-list/multi-tab-list-page-types';
import { MultiTabListPage } from '../multi-tab-list';
import AllProjectsPage from '../projects-list/AllProjectsPage';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import { ApprovalTasksList } from '../approval-tasks';

type PageContentsProps = {
  namespace: string;
  perspective: string;
};

export const PageContents: React.FC<PageContentsProps> = ({
  namespace,
  perspective,
}) => {
  const { t } = useTranslation();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const isApprovalTaskEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_APPROVAL_TASK);

  const menuActions: MenuActions = {
    pipeline: {
      model: PipelineModel,
      onSelection: (key: string, action: MenuAction, url: string) =>
        `${url}/builder`,
    },
    pipelineRun: { model: PipelineRunModel },
    repository: {
      model: RepositoryModel,
      onSelection: (_key: string, _action: MenuAction, url: string) =>
        `${url}/form`,
    },
  };
  const pages: NavPage[] = [
    {
      href: '',
      // t(PipelineModel.labelPluralKey)
      name: PipelineModel.labelPluralKey,
      component: PipelinesList,
    },
    {
      href: 'pipeline-runs',
      // t(PipelineRunModel.labelPluralKey)
      name: PipelineRunModel.labelPluralKey,
      component: PipelineRunsList,
    },
    ...(isRepositoryEnabled
      ? [
          {
            href: 'repositories',
            // t(RepositoryModel.labelPluralKey)
            name: RepositoryModel.labelPluralKey,
            component: RepositoriesList,
          },
        ]
      : []),
    ...(isApprovalTaskEnabled
      ? [
          {
            href: 'approvals',
            // t(ApprovalTaskModel.labelPluralKey)
            name: ApprovalTaskModel.labelPluralKey,
            component: ApprovalTasksList,
          },
        ]
      : []),
  ];

  return perspective === 'dev' ? (
    namespace ? (
      <MultiTabListPage
        pages={pages}
        title={t('Pipelines')}
        menuActions={menuActions}
        telemetryPrefix="Pipelines"
      />
    ) : (
      <AllProjectsPage />
    )
  ) : (
    <MultiTabListPage
      pages={pages}
      title={t('Pipelines')}
      menuActions={menuActions}
      telemetryPrefix="Pipelines"
    />
  );
};

const PipelinesTabbedPage: React.FC = () => {
  const { ns } = useParams();
  const location = useLocation();
  const perspective = location?.pathname.includes('dev-pipelines')
    ? 'dev'
    : 'admin';
  return (
    <>
      <NamespaceBar />
      <PageContents namespace={ns} perspective={perspective} />
    </>
  );
};

export default PipelinesTabbedPage;
