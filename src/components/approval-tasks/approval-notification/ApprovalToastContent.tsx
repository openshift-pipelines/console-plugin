import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '../../utils/link';

import './ApprovalToastContent.scss';

interface ApprovalToastContentProps {
  type: string;
  uniquePipelineRuns: number;
  devconsolePath?: string;
  adminconsolePath?: string;
}

const ApprovalToastContent: React.FC<ApprovalToastContentProps> = ({
  type,
  uniquePipelineRuns,
  devconsolePath,
  adminconsolePath,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (type === 'current') {
    return (
      <>
        {t('Your approval has been requested on {{plrs}} pipeline', {
          plrs: uniquePipelineRuns,
        })}
        {t('run{{plural}}.', {
          plural: uniquePipelineRuns > 1 ? 's' : '',
        })}
        <p className="pipelines-approval-toast__link">
          <ExternalLink href={devconsolePath} text={t('Go to Approvals tab')} />
        </p>
      </>
    );
  }
  if (type === 'other') {
    return (
      <>
        {t('Your approval has been requested on {{plrs}} pipeline', {
          plrs: uniquePipelineRuns,
        })}
        {t('run{{plural}} in other namespaces.', {
          plural: uniquePipelineRuns > 1 ? 's' : '',
        })}
        <p className="pipelines-approval-toast__link">
          <ExternalLink
            href={adminconsolePath}
            text={t('Go to Admin Approvals tab')}
          />
        </p>
      </>
    );
  }
  return null;
};

export default ApprovalToastContent;
