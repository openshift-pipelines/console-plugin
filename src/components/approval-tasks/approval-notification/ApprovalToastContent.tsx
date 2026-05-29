import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '../../utils/link';

import './ApprovalToastContent.scss';

interface ApprovalToastContentProps {
  type: 'current' | 'other' | 'admin';
  uniquePipelineRuns: number;
  path: string;
  namespaceName?: string;
}

const ApprovalToastContent: FC<ApprovalToastContentProps> = ({
  type,
  uniquePipelineRuns,
  path,
  namespaceName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const linkText =
    type === 'admin'
      ? t('Go to Admin Approvals tab')
      : t('Go to Approvals tab');
  const plural = uniquePipelineRuns > 1 ? 's' : '';
  const suffixMap = {
    other: t('run{{plural}} in namespace {{namespaceName}}.', {
      plural,
      namespaceName,
    }),
    admin: t('run{{plural}} in other namespaces.', { plural }),
    current: t('run{{plural}}.', { plural }),
  };

  return (
    <>
      {t('Your approval has been requested on {{plrs}} pipeline', {
        plrs: uniquePipelineRuns,
      })}
      {suffixMap[type]}
      <p className="pipelines-approval-toast__link">
        <ExternalLink href={path} text={linkText} />
      </p>
    </>
  );
};

export default ApprovalToastContent;
