import * as React from 'react';
import { Text } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { ExternalLink } from '../utils/link';
import { ConfigMapKind } from './types';

type GithubSectionProps = {
  pac: ConfigMapKind;
};

const GithubSection: React.FC<GithubSectionProps> = ({ pac }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const appLink = pac?.data?.['app-link'] ?? '';
  return (
    <Text>
      <Trans t={t} ns="plugin__pipelines-console-plugin">
        Use <ExternalLink href={appLink}>{appLink}</ExternalLink> link to
        install the GitHub Application to your repositories in your
        organisation/account.
      </Trans>
    </Text>
  );
};

export default GithubSection;
