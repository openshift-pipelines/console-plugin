import {
  getGroupVersionKindForModel,
  K8sKind,
  ListPageCreateLink,
} from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import * as React from 'react';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useTranslation } from 'react-i18next';
import './ListPage.scss';

type ListPageCreateButtonProps = {
  model: K8sKind;
  namespace: string;
  hideTitle: boolean;
};

const getCreateLink = (model: K8sKind, namespace: string) => {
  if (model.kind === 'Pipeline') {
    return `/k8s/ns/${namespace || 'default'}/${getReferenceForModel(
      model,
    )}/~new/builder`;
  }
  if (model.kind === 'Repository') {
    return `/k8s/ns/${namespace || 'default'}/${getReferenceForModel(
      model,
    )}/~new/form`;
  }
  return `/k8s${
    namespace ? `/ns/${namespace}` : `/cluster`
  }/${getReferenceForModel(model)}/~new`;
};

const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = ({
  model,
  namespace,
  hideTitle,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <div
      className={classNames({
        'cp-list-page-create-link-wrapper': hideTitle,
      })}
    >
      <ListPageCreateLink
        createAccessReview={{
          groupVersionKind: getGroupVersionKindForModel(model),
          namespace,
        }}
        to={getCreateLink(model, namespace)}
      >
        {t('Create {{name}}', { name: model.label })}
      </ListPageCreateLink>
    </div>
  );
};

export default ListPageCreateButton;
