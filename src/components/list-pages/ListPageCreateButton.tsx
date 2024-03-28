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

const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = ({
  model,
  namespace,
  hideTitle,
}) => {
  const { t } = useTranslation();
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
        to={`/k8s${
          namespace ? `/ns/${namespace}` : `/cluster`
        }/${getReferenceForModel(model)}/~new`}
      >
        {t('Create {{name}}', { name: model.label })}
      </ListPageCreateLink>
    </div>
  );
};

export default ListPageCreateButton;
