import type { FC } from 'react';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { ExternalLink } from '../utils/link';
import { getGitProviderIcon } from '../utils/repository-utils';

type RepositoryURLProps = {
  obj: K8sResourceKind;
};

const RepositoryURL: FC<RepositoryURLProps> = ({ obj }) => {
  return (
    <ExternalLink href={obj?.spec?.url}>
      {getGitProviderIcon(obj?.spec?.url)} {obj?.spec?.url}
    </ExternalLink>
  );
};

export default RepositoryURL;
