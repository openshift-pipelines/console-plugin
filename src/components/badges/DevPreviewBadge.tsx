import * as React from 'react';
import { Label } from '@patternfly/react-core';
import './Badge.scss';
import { useTranslation } from 'react-i18next';

const DevPreviewBadge: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return <Label className="ocs-preview-badge">{t('Dev preview')}</Label>;
};

export default DevPreviewBadge;
