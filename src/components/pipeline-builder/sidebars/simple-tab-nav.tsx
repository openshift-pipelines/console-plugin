import type { FunctionComponent, ReactElement, FC } from 'react';
import { useState, isValidElement, createElement } from 'react';
import classNames from 'classnames';
import { Tabs, Tab } from '@patternfly/react-core';

export type Tab = {
  name: string;
  component: FunctionComponent<{}> | ReactElement;
};

type SimpleTabNavProps = {
  onClickTab?: (name: string) => void;
  selectedTab?: string;
  tabProps?: any;
  tabs: Tab[];
  additionalClassNames?: string;
  withinSidebar?: boolean;
  noInset?: boolean;
};

export const SimpleTabNav: FC<SimpleTabNavProps> = ({
  onClickTab,
  selectedTab,
  tabProps = null,
  tabs,
  additionalClassNames,
  withinSidebar,
  noInset,
}) => {
  const [activeKey, setActiveKey] = useState<string>(
    selectedTab || tabs[0]?.name,
  );

  const handleTabClick = (_e, tabIndex: string) => {
    setActiveKey(tabIndex);
    onClickTab && onClickTab(tabIndex);
  };

  return (
    (<div>
      <Tabs
        activeKey={activeKey}
        onSelect={handleTabClick}
        className={classNames(
          { 'pf-v6-u-mb-md': withinSidebar },
          additionalClassNames,
        )}
        unmountOnExit
      >
        {tabs.map((tab) => {
          const content =
            !isValidElement(tab.component) &&
            !Array.isArray(tab.component)
              ? createElement(
                  tab.component as FunctionComponent,
                  tabProps,
                )
              : tab.component;

          return (
            <Tab
              key={tab.name}
              eventKey={tab.name}
              title={tab.name}
              data-test={`horizontal-link-${tab.name}`}
            >
              {content}
            </Tab>
          );
        })}
      </Tabs>
    </div>)
  );
};
