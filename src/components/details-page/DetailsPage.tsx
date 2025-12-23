import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dropdown,
  DropdownItem,
  DropdownItemProps,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
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

export type Action = {
  type?: string;
  key: string;
  label: React.ReactNode;
  hidden?: boolean;
  disabledTooltip?: React.ReactNode;
} & Omit<DropdownItemProps, 'label'>;

type DetailsPageProps = {
  obj?: K8sResourceKind;
  title: React.ReactNode;
  headTitle?: string;
  preComponent?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: ({ name: string; path: string } | React.ReactElement)[];
  actions?: Action[];
  customActionMenu?: (
    kindObj: K8sModel,
    obj: K8sResourceKind,
  ) => React.ReactNode;
  baseURL?: string;
  onTabSelect?: (selectedTabKey: string) => void;
  model?: K8sModel;
  pages?: NavPage[];
};

const DetailsPage: React.FC<React.PropsWithChildren<DetailsPageProps>> = ({
  obj,
  title,
  preComponent = null,
  footer,
  description,
  breadcrumbs,
  actions = [],
  customActionMenu,
  model,
  pages,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setIsOpen((v) => !v), []);
  const setClosed = React.useCallback(() => setIsOpen(false), []);

  const dropdownItems = React.useMemo(
    () =>
      actions?.reduce((acc, action) => {
        const { key, label, isDisabled, component, ...props } = action;
        if (action.hidden) {
          return acc;
        }

        acc.push(
          <DropdownItem
            key={key}
            data-test={key}
            isDisabled={isDisabled}
            component={!isDisabled ? component : 'a'}
            {...props}
          >
            {label}
          </DropdownItem>,
        );

        return acc;
      }, [] as React.ReactNode[]),
    [actions],
  );

  const renderActionMenu = React.useCallback(() => {
    if (customActionMenu && model && obj) {
      return customActionMenu(model, obj);
    }
    // Render default action menu as fallback
    if (dropdownItems && dropdownItems.length > 0) {
      return (
        <Dropdown
          onSelect={setClosed}
          onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              aria-label="Actions"
              variant="primary"
              onClick={toggleIsOpen}
              isExpanded={isOpen}
            >
              {t('Actions')}
            </MenuToggle>
          )}
          isOpen={isOpen}
          popperProps={{ position: 'right' }}
        >
          <DropdownList>{dropdownItems}</DropdownList>
        </Dropdown>
      );
    }
    return null;
  }, [
    customActionMenu,
    model,
    obj,
    dropdownItems,
    setClosed,
    toggleIsOpen,
    isOpen,
  ]);

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
          {(customActionMenu || actions?.length > 0) && (
            <FlexItem align={{ default: 'alignRight' }}>
              {renderActionMenu()}
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
