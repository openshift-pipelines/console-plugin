import type { ReactNode, ReactElement, PropsWithChildren, FC } from 'react';
import {
  Flex,
  FlexItem,
  PageGroup,
  PageSection,
  Content,
} from '@patternfly/react-core';
import {
  HorizontalNav,
  K8sModel,
  K8sResourceKind,
  NavPage,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import BreadCrumbs from './breadcrumbs/BreadCrumbs';
import { getReferenceForModel } from '../pipelines-overview/utils';
import './DetailsPage.scss';

type DetailsPageProps = {
  obj?: K8sResourceKind;
  title: ReactNode;
  headTitle?: string;
  preComponent?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ({ name: string; path: string } | ReactElement)[];
  customActionMenu?: (kindObj: K8sModel, obj: K8sResourceKind) => ReactNode;
  baseURL?: string;
  onTabSelect?: (selectedTabKey: string) => void;
  model?: K8sModel;
  pages?: NavPage[];
};

const DetailsPage: FC<PropsWithChildren<DetailsPageProps>> = ({
  obj,
  title,
  preComponent = null,
  footer,
  description,
  breadcrumbs,
  customActionMenu,
  model,
  pages,
}) => {
  const renderTitle = () => {
    return (
      <div className="co-m-pane__name co-resource-item co-m-pane__heading">
        {model && (
          <ResourceIcon
            kind={getReferenceForModel(model)}
            className="co-m-resource-icon--lg"
          />
        )}
        <span
          data-test-id="resource-title"
          className="co-resource-item__resource-name"
        >
          {title}
        </span>
      </div>
    );
  };

  return (
    <PageGroup data-test="details" className="app-details">
      <PageSection
        hasBodyWrapper={false}
        type="breadcrumb"
        className="co-m-nav-title--detail"
      >
        {breadcrumbs && (
          <BreadCrumbs
            data-test="details__breadcrumbs"
            breadcrumbs={breadcrumbs}
          />
        )}
        <Flex style={{ paddingTop: 'var(--pf-t--global--spacer--md)' }}>
          <FlexItem>
            <Content>
              {renderTitle()}
              {description && <Content component="p">{description}</Content>}
            </Content>
          </FlexItem>
          {customActionMenu && model && obj && (
            <FlexItem align={{ default: 'alignRight' }}>
              {customActionMenu(model, obj)}
            </FlexItem>
          )}
        </Flex>
      </PageSection>
      {preComponent}
      <HorizontalNav pages={pages} resource={obj} />
      {footer && (
        <PageSection hasBodyWrapper={false} isFilled={false}>
          {footer}
        </PageSection>
      )}
    </PageGroup>
  );
};

export default DetailsPage;
