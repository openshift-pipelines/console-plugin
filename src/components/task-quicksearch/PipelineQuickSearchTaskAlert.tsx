import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CTALabel } from './const';

interface PipelineQuickSearchTaskAlertProps {
  ctaType: string;
}

const PipelineQuickSearchTaskAlert: React.FC<
  PipelineQuickSearchTaskAlertProps
> = ({ ctaType }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  switch (ctaType) {
    case CTALabel.Install:
      return (
        <Alert
          className="co-alert"
          variant="info"
          title={t('This task is not installed')}
          isInline
        >
          <p>{t('Adding this task may take a few moments.')}</p>
        </Alert>
      );
    case CTALabel.Update:
      return (
        <Alert
          className="co-alert"
          title={t('Task version will be updated across all instances')}
          variant="warning"
          isInline
        >
          <p>
            {t(
              `Only update this task's version if you'd like to replace all of its references in the namespace.`,
            )}
          </p>
        </Alert>
      );
    default:
      return null;
  }
};

export default PipelineQuickSearchTaskAlert;
