import * as React from 'react';
import { BitbucketIcon } from '@patternfly/react-icons/dist/js/icons';
import { GitAltIcon } from '@patternfly/react-icons/dist/js/icons';
import { GithubIcon } from '@patternfly/react-icons/dist/js/icons';
import { GitlabIcon } from '@patternfly/react-icons/dist/js/icons';

export const gitUrlRegex =
  /^((((ssh|git|https?:?):\/\/:?)(([^\s@]+@|[^@]:?)[-\w.]+(:\d\d+:?)?(\/[-\w.~/?[\]!$&'()*+,;=:@%]*:?)?:?))|([^\s@]+@[-\w.]+:[-\w.~/?[\]!$&'()*+,;=:@%]*?:?))$/;

export enum GitProvider {
  GITHUB = 'github',
  BITBUCKET = 'bitbucket',
  GITLAB = 'gitlab',
  UNSURE = 'other',
  INVALID = '',
}

const hasDomain = (url: string, domain: string): boolean => {
  return (
    url.startsWith(`https://${domain}/`) ||
    url.startsWith(`https://www.${domain}/`) ||
    url.includes(`@${domain}:`)
  );
};

export const detectGitType = (url: string): GitProvider => {
  if (!gitUrlRegex.test(url)) {
    // Not a URL
    return GitProvider.INVALID;
  }
  if (hasDomain(url, 'github.com')) {
    return GitProvider.GITHUB;
  }
  if (hasDomain(url, 'bitbucket.org')) {
    return GitProvider.BITBUCKET;
  }
  if (hasDomain(url, 'gitlab.com')) {
    return GitProvider.GITLAB;
  }
  // Not a known URL
  return GitProvider.UNSURE;
};

export const getGitProviderIcon = (url: string) => {
  const gitType = detectGitType(url);

  switch (gitType) {
    case GitProvider.GITHUB: {
      return <GithubIcon title={url} />;
    }
    case GitProvider.GITLAB: {
      return <GitlabIcon title={url} />;
    }
    case GitProvider.BITBUCKET: {
      return <BitbucketIcon title={url} />;
    }
    default: {
      return <GitAltIcon title={url} />;
    }
  }
};
