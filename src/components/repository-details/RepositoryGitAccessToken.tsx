import {
  getGroupVersionKindForModel,
  K8sResourceKind,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { SecretModel } from '../../models';

type RepositoryGitAccessTokenProps = {
  obj: K8sResourceKind;
};

const RepositoryGitAccessToken: FC<RepositoryGitAccessTokenProps> = ({
  obj,
}) => {
  return (
    <ResourceLink
      groupVersionKind={getGroupVersionKindForModel(SecretModel)}
      name={obj?.spec?.git_provider?.secret?.name}
      namespace={obj.metadata.namespace}
    />
  );
};

export default RepositoryGitAccessToken;
