import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceKind,
  OwnerReference,
  ResourceLink,
} from '@openshift-console/dynamic-plugin-sdk';
import { referenceForOwnerRef } from '../utils/k8s-utils';

export const OwnerReferences: React.FC<OwnerReferencesProps> = ({
  resource,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const owners = (_.get(resource.metadata, 'ownerReferences') || []).map(
    (o: OwnerReference) => (
      <ResourceLink
        key={o.uid}
        kind={referenceForOwnerRef(o)}
        name={o.name}
        namespace={resource.metadata.namespace}
      />
    ),
  );
  return owners.length ? (
    <>{owners}</>
  ) : (
    <span className="text-muted">{t('No owner')}</span>
  );
};

type OwnerReferencesProps = {
  resource: K8sResourceKind;
};

OwnerReferences.displayName = 'OwnerReferences';
