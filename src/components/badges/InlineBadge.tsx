import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import './Badge.scss';
import { useTranslation } from 'react-i18next';

export const InlineTechPreviewBadge: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Badge className="ocs-badge__inline" isRead>
      {t('Tech preview')}
    </Badge>
  );
};

export const InlineDevPreviewBadge: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Badge className="ocs-badge__inline" isRead>
      {t('Dev preview')}
    </Badge>
  );
};
