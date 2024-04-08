import * as React from 'react';
import { useK8sGet } from '../hooks/use-k8sGet-hook';
import { ConfigMapModel } from '../../models';
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { PAC_INFO, PIPELINE_NAMESPACE } from '../../consts';
import { ClipboardCopy } from '@patternfly/react-core';

const RepositoryWebhookURL = () => {
  const [pac, loaded] = useK8sGet<K8sResourceKind>(
    ConfigMapModel,
    PAC_INFO,
    PIPELINE_NAMESPACE,
  );
  return (
    <>
      {loaded && (
        <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
          {pac?.data?.['controller-url']}
        </ClipboardCopy>
      )}
    </>
  );
};

export default RepositoryWebhookURL;
