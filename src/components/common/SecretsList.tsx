import {
  FirehoseResult,
  ResourceLink,
  useK8sWatchResources,
  WatchK8sResources,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { SecretModel, ServiceAccountModel } from '../../models';
import { PIPELINE_SERVICE_ACCOUNT } from '../../consts';
import { SecretKind, SecretType } from '../../types';
import { ServiceAccountType } from '../utils/pipeline-utils';
import SecondaryStatus from '../pipelines-details/multi-column-field/SecondaryStatus';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

type SecretsProps = {
  secrets?: FirehoseResult<SecretKind[]>;
  serviceaccounts?: FirehoseResult<ServiceAccountType>;
};

type SecretsListProps = {
  namespace: string;
};

const secretTypes = [
  SecretType.dockerconfigjson,
  SecretType.basicAuth,
  SecretType.sshAuth,
];

export const Secrets: React.FC<SecretsProps> = ({
  secrets,
  serviceaccounts,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const serviceAccountSecrets = _.map(serviceaccounts.data?.secrets, 'name');
  const filterData = _.filter(
    secrets.data,
    (secret) =>
      _.includes(secretTypes, secret.type) &&
      _.includes(serviceAccountSecrets, secret.metadata.name),
  );
  const sortedFilterData = _.sortBy(filterData, (data) => data.metadata.name);

  return (
    <div className="odc-secrets-list">
      {sortedFilterData.map((secret) => {
        return (
          <ResourceLink
            key={secret.metadata.uid}
            kind={SecretModel.kind}
            name={secret.metadata.name}
            namespace={secret.metadata.namespace}
            linkTo={false}
          />
        );
      })}
      {_.isEmpty(sortedFilterData) && (
        <SecondaryStatus status={t('No secrets found')} />
      )}
    </div>
  );
};

const SecretsList: React.FC<SecretsListProps> = ({ namespace }) => {
  const watchedResources: WatchK8sResources<{
    secrets: SecretKind[];
    serviceaccounts: ServiceAccountType;
  }> = {
    secrets: {
      isList: true,
      kind: SecretModel.kind,
      namespace: namespace,
      optional: true,
    },
    serviceaccounts: {
      isList: false,
      namespace,
      kind: ServiceAccountModel.kind,
      name: PIPELINE_SERVICE_ACCOUNT,
    },
  };
  const secretResources = useK8sWatchResources<{
    secrets: SecretKind[];
    serviceaccounts: ServiceAccountType;
  }>(watchedResources);
  return (
    <Secrets
      secrets={secretResources.secrets}
      serviceaccounts={secretResources.serviceaccounts}
    />
  );
};

export default SecretsList;
