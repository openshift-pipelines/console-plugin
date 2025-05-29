import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import BanIcon from '@patternfly/react-icons/dist/esm/icons/ban-icon';

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

export const AccessDenied: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div>
      <Helmet>
        <title>{t('Access Denied')}</title>
      </Helmet>
      <EmptyState variant={EmptyStateVariant.lg}>
        <EmptyStateHeader
          titleText={t(
            "You don't have access to this section due to cluster policy",
          )}
          headingLevel="h4"
          icon={<EmptyStateIcon icon={BanIcon} />}
        />
      </EmptyState>
    </div>
  );
};
