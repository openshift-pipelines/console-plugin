import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Content,
  Title,
} from '@patternfly/react-core';
import { useHistory } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import CatalogBadges from '../catalog/CatalogBadges';
import { handleCta } from './utils/quick-search-utils';
import { TaskSearchCallback } from '../pipeline-builder/types';

import './QuickSearchDetails.scss';

export type QuickSearchDetailsRendererProps = {
  selectedItem: CatalogItem;
  closeModal: () => void;
  namespace?: string;
  callback?: TaskSearchCallback;
  setFailedTasks?: React.Dispatch<React.SetStateAction<string[]>>;
};
export type DetailsRendererFunction = (
  props: QuickSearchDetailsRendererProps,
) => React.ReactNode;
export interface QuickSearchDetailsProps
  extends QuickSearchDetailsRendererProps {
  detailsRenderer: DetailsRendererFunction;
}

const QuickSearchDetails: React.FC<QuickSearchDetailsProps> = ({
  selectedItem,
  closeModal,
  detailsRenderer,
  namespace,
  callback,
  setFailedTasks,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const history = useHistory();
  const defaultContentRenderer: DetailsRendererFunction = (
    props: QuickSearchDetailsProps,
  ): React.ReactNode => {
    return (
      <>
        <Title headingLevel="h4">{props.selectedItem.name}</Title>
        {props.selectedItem.provider && (
          <span className="ocs-quick-search-details__provider">
            {t('Provided by {{provider}}', {
              provider: props.selectedItem.provider,
            })}
          </span>
        )}
        {selectedItem.badges?.length > 0 ? (
          <CatalogBadges badges={selectedItem.badges} />
        ) : undefined}
        <Button
          variant={ButtonVariant.primary}
          className="ocs-quick-search-details__form-button"
          data-test="create-quick-search"
          onClick={(e) => {
            handleCta(e, props.selectedItem, props.closeModal, history);
          }}
        >
          {props.selectedItem.cta.label}
        </Button>
        <Content className="ocs-quick-search-details__description">
          {props.selectedItem.description}
        </Content>
      </>
    );
  };
  const detailsContentRenderer: DetailsRendererFunction =
    detailsRenderer ?? defaultContentRenderer;

  return (
    <div className="ocs-quick-search-details">
      {detailsContentRenderer({
        selectedItem,
        closeModal,
        namespace,
        callback,
        setFailedTasks,
      })}
    </div>
  );
};

export default QuickSearchDetails;
