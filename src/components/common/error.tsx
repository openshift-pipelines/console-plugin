import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateVariant,
} from '@patternfly/react-core';

export const ErrorPage404: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div>
      <Helmet>
        <title>{t('Page Not Found (404)')}</title>
      </Helmet>
      <EmptyState variant={EmptyStateVariant.lg}>
        <EmptyStateHeader
          titleText={t('Page Not Found (404)')}
          headingLevel="h4"
        />
      </EmptyState>
    </div>
  );
};
