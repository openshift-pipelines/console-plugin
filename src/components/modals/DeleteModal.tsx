import React, { memo, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';

import {
  getGroupVersionKindForResource,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { useK8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/hooks/useK8sModel';
import { ButtonVariant } from '@patternfly/react-core';
import TabModal from './TabModal';
import { useTranslation } from 'react-i18next';
import useActiveNamespace from '../hooks/useActiveNamespace';
import { getResourceUrl } from '../utils/k8s-resource';
import ConfirmActionMessage from './ConfirmActionMessage';

type DeleteModalProps = {
  body?: ReactNode | string;
  headerText?: string;
  isOpen: boolean;
  obj: K8sResourceCommon;
  onClose: () => void;
  onDeleteSubmit: () => Promise<K8sResourceCommon | void>;
  redirectUrl?: string;
  shouldRedirect?: boolean;
};

const DeleteModal: React.FC<DeleteModalProps> = memo(
  ({
    body,
    headerText,
    isOpen,
    obj,
    onClose,
    onDeleteSubmit,
    redirectUrl,
    shouldRedirect = true,
  }) => {
    const { t } = useTranslation('plugin__pipelines-console-plugin');
    const history = useHistory();

    const [model] = useK8sModel(getGroupVersionKindForResource(obj));
    const [lastNamespace] = useActiveNamespace();
    const url =
      redirectUrl || getResourceUrl({ activeNamespace: lastNamespace, model });

    return (
      <TabModal<K8sResourceCommon>
        onSubmit={async () => {
          await onDeleteSubmit();
          shouldRedirect && history.push(url);
        }}
        headerText={headerText || t('Delete Resource?')}
        isOpen={isOpen}
        obj={obj}
        onClose={onClose}
        submitBtnText={t('Delete')}
        submitBtnVariant={ButtonVariant.danger}
        titleIconVariant="warning"
      >
        {body}

        <ConfirmActionMessage obj={obj} />
      </TabModal>
    );
  },
);

export default DeleteModal;
