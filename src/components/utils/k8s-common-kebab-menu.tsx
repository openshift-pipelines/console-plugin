import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DropdownItem } from '@patternfly/react-core';
import {
  K8sModel,
  K8sResourceCommon,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '../pipelines-overview/utils';
import {
  KEBAB_ACTION_DELETE_ID,
  KEBAB_ACTION_EDIT_ANNOTATIONS_ID,
  KEBAB_ACTION_EDIT_ID,
  KEBAB_ACTION_EDIT_LABELS_ID,
} from '../../consts';

export const K8sCommonKebabMenu = (obj: K8sResourceCommon, model: K8sModel) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const launchDeleteModal = useDeleteModal(obj);
  const launchAnnotationsModal = useAnnotationsModal(obj);
  const launchLabelsModal = useLabelsModal(obj);
  const history = useHistory();
  const { name, namespace } = obj.metadata;

  const canEditResource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'update',
    name,
    namespace,
  });
  const canDeleteResource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const editURL = namespace
    ? `/k8s/ns/${namespace}/${getReferenceForModel(model)}/${encodeURIComponent(
        name,
      )}/yaml`
    : `/k8s/cluster/${getReferenceForModel(model)}/${encodeURIComponent(
        name,
      )}/yaml`;

  return [
    <DropdownItem
      key={KEBAB_ACTION_EDIT_LABELS_ID}
      component="button"
      onClick={launchLabelsModal}
      isDisabled={!canEditResource}
      data-test-action={KEBAB_ACTION_EDIT_LABELS_ID}
    >
      {t('Edit labels')}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_EDIT_ANNOTATIONS_ID}
      component="button"
      onClick={() => launchAnnotationsModal()}
      isDisabled={!canEditResource[0]}
      data-test-action={KEBAB_ACTION_EDIT_ANNOTATIONS_ID}
    >
      {t('Edit annotations')}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_EDIT_ID}
      component="button"
      onClick={() => history.push(editURL)}
      isDisabled={!canEditResource[0]}
      data-test-action={KEBAB_ACTION_EDIT_ID}
    >
      {t('Edit {{resourceKind}}', { resourceKind: model.kind })}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_DELETE_ID}
      component="button"
      onClick={launchDeleteModal}
      isDisabled={!canDeleteResource[0]}
      data-test-action={KEBAB_ACTION_DELETE_ID}
    >
      {t('Delete {{resourceKind}}', { resourceKind: model.kind })}
    </DropdownItem>,
  ];
};
