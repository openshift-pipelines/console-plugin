import * as React from 'react';
import classNames from 'classnames';
import { Tabs, Tab } from '@patternfly/react-core';

export type Tab = {
  name: string;
  component: React.FunctionComponent<{}> | React.ReactElement;
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

export const SimpleTabNav: React.FC<SimpleTabNavProps> = ({
  onClickTab,
  selectedTab,
  tabProps = null,
  tabs,
  additionalClassNames,
  withinSidebar,
  noInset,
}) => {
  const [activeKey, setActiveKey] = React.useState<string>(
    selectedTab || tabs[0]?.name,
  );

  const handleTabClick = (_e, tabIndex: string) => {
    setActiveKey(tabIndex);
    onClickTab && onClickTab(tabIndex);
  };

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        onSelect={handleTabClick}
        className={classNames(
          { 'pf-u-mb-md': withinSidebar },
          additionalClassNames,
        )}
        unmountOnExit
      >
        {tabs.map((tab) => {
          const content =
            !React.isValidElement(tab.component) &&
            !Array.isArray(tab.component)
              ? React.createElement(
                  tab.component as React.FunctionComponent,
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
    </div>
  );
};
