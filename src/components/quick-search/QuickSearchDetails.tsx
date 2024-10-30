import * as React from 'react';
import {
  Button,
  ButtonVariant,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import CatalogBadges from '../catalog/CatalogBadges';
import { handleCta } from './utils/quick-search-utils';
import { useHistory } from 'react-router';

import './QuickSearchDetails.scss';

export type QuickSearchDetailsRendererProps = {
  selectedItem: CatalogItem;
  closeModal: () => void;
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
        <TextContent className="ocs-quick-search-details__description">
          {props.selectedItem.description}
        </TextContent>
      </>
    );
  };
  const detailsContentRenderer: DetailsRendererFunction =
    detailsRenderer ?? defaultContentRenderer;

  return (
    <div className="ocs-quick-search-details">
      {detailsContentRenderer({ selectedItem, closeModal })}
    </div>
  );
};

export default QuickSearchDetails;
