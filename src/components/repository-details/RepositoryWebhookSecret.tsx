import {
  getGroupVersionKindForModel,
  K8sResourceKind,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { SecretModel } from '../../models';

type RepositoryWebhookSecretProps = {
  obj: K8sResourceKind;
};

const RepositoryWebhookSecret: React.FC<RepositoryWebhookSecretProps> = ({
  obj,
}) => {
  return (
    <ResourceLink
      groupVersionKind={getGroupVersionKindForModel(SecretModel)}
      name={obj?.spec?.git_provider?.webhook_secret?.name}
      namespace={obj.metadata.namespace}
    />
  );
};

export default RepositoryWebhookSecret;
