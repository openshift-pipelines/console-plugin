import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  NamespaceBar,
  NavPage,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel, PipelineRunModel, RepositoryModel } from '../../models';
import { RepositoriesList } from '../repositories-list';
import { PipelinesList } from '../pipelines-list';
import { PipelineRunsList } from '../pipelineRuns-list';
import { MenuAction, MenuActions, MultiTabListPage } from '../multi-tab-list';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE } from '../../consts';

export const PageContents: React.FC = () => {
  const { t } = useTranslation();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);

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
  ];

  //   return namespace ? (
  //     <MultiTabListPage
  //       pages={pages}
  //       title={t('pipelines-plugin~Pipelines')}
  //       menuActions={menuActions}
  //       telemetryPrefix="Pipelines"
  //     />
  //   ) : (
  //     <CreateProjectListPage title={t('pipelines-plugin~Pipelines')}>
  //       {(openProjectModal) => (
  //         <Trans t={t} ns="pipelines-plugin">
  //           Select a Project to view its details
  //           <CreateAProjectButton openProjectModal={openProjectModal} />.
  //         </Trans>
  //       )}
  //     </CreateProjectListPage>
  //   );
  return (
    <MultiTabListPage
      pages={pages}
      title={t('Pipelines')}
      menuActions={menuActions}
      telemetryPrefix="Pipelines"
    />
  );
};

// const PageContentsWithStartGuide = withStartGuide(PageContents);

const PipelinesTabbedPage: React.FC = (props) => {
  return (
    <>
      <NamespaceBar />
      <PageContents {...props} />
    </>
  );
};

export default PipelinesTabbedPage;
