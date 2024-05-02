import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import {
  Divider,
  TextContent,
  TextVariants,
  Text,
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ProjectsList from './ProjectsList';
import './AllProjectsPage.scss';

const AllProjectsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <>
      <ListPageHeader title={t('Pipelines')} />
      <TextContent className="cp-all-projects-page-description">
        <Text component={TextVariants.p}>
          {t('Select a Project to view its details')}
        </Text>
      </TextContent>
      <Divider className="co-divider" />
      <ProjectsList />
    </>
  );
};

export default AllProjectsPage;
