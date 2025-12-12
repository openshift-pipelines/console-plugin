import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import {
  Divider,
  Content,
  ContentVariants,
  } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ProjectsList from './ProjectsList';
import './AllProjectsPage.scss';

interface AllProjectsPageProps {
  pageTitle?: string;
}

const AllProjectsPage: React.FC<AllProjectsPageProps> = ({ pageTitle }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <ListPageHeader title={pageTitle || t('Pipelines')} />
      <Content className="cp-all-projects-page-description">
        <Content component={ContentVariants.p}>
          {t('Select a Project to view its details')}
        </Content>
      </Content>
      <Divider className="co-divider" />
      <ProjectsList />
    </>
  );
};

export default AllProjectsPage;
