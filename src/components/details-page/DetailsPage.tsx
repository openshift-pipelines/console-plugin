import * as React from 'react';
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
  PageSectionVariants,
  Text,
  TextContent,
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
  model,
  pages,
}) => {
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
      <PageSection type="breadcrumb" className="co-m-nav-title--detail">
        {breadcrumbs && (
          <BreadCrumbs
            data-test="details__breadcrumbs"
            breadcrumbs={breadcrumbs}
          />
        )}
        <Flex style={{ paddingTop: 'var(--pf-v5-global--spacer--md)' }}>
          <FlexItem>
            <TextContent>
              {renderTitle()}
              {description && <Text component="p">{description}</Text>}
            </TextContent>
          </FlexItem>
          {actions?.length ? (
            <FlexItem align={{ default: 'alignRight' }}>
              <Dropdown
                data-test="details__actions"
                onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
                onSelect={setClosed}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={toggleIsOpen}
                    isExpanded={isOpen}
                  >
                    Actions
                  </MenuToggle>
                )}
                isOpen={isOpen}
              >
                <DropdownList className="action-menu-dropdown">
                  {dropdownItems}
                </DropdownList>
              </Dropdown>
            </FlexItem>
          ) : null}
        </Flex>
      </PageSection>
      {preComponent}
      <HorizontalNav pages={pages} resource={obj} />
      {footer && (
        <PageSection variant={PageSectionVariants.light} isFilled={false}>
          {footer}
        </PageSection>
      )}
    </PageGroup>
  );
};

export default DetailsPage;
