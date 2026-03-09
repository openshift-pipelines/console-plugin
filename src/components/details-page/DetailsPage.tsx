import type { ReactNode, ReactElement, PropsWithChildren, FC, Ref } from 'react';
import { useState, useCallback, useMemo } from 'react';
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
  label: ReactNode;
  hidden?: boolean;
  disabledTooltip?: ReactNode;
} & Omit<DropdownItemProps, 'label'>;

type DetailsPageProps = {
  obj?: K8sResourceKind;
  title: ReactNode;
  headTitle?: string;
  preComponent?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ({ name: string; path: string } | ReactElement)[];
  actions?: Action[];
  customActionMenu?: (
    kindObj: K8sModel,
    obj: K8sResourceKind,
  ) => ReactNode;
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
  actions = [],
  customActionMenu,
  model,
  pages,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setIsOpen] = useState(false);
  const toggleIsOpen = useCallback(() => setIsOpen((v) => !v), []);
  const setClosed = useCallback(() => setIsOpen(false), []);

  const dropdownItems = useMemo(
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
      }, [] as ReactNode[]),
    [actions],
  );

  const renderActionMenu = useCallback(() => {
    if (customActionMenu && model && obj) {
      return customActionMenu(model, obj);
    }
    // Render default action menu as fallback
    if (dropdownItems && dropdownItems.length > 0) {
      return (
        (<Dropdown
          onSelect={setClosed}
          onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
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
        </Dropdown>)
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
