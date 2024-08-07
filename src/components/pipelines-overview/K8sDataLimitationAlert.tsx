import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';

export const K8sDataLimitationAlert: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Alert isInline variant="info" title={t('Info')}>
      <p>
        {t('Data is incomplete. To see the full view, please enable ')}
        <a
          href="https://docs.openshift.com/pipelines/latest/records/using-tekton-results-for-openshift-pipelines-observability.html#preparing-to-install_using-tekton-results-for-openshift-pipelines-observability"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Tekton results')}
          <span className="co-external-link" />
        </a>
        .
      </p>
    </Alert>
  );
};
