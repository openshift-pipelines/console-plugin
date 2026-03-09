import type { ReactNode, FC } from 'react';
import './TopologySideBarTabSection.scss';

const TopologySideBarTabSection: FC<{ children?: ReactNode }> = ({
  children,
}) => {
  return <div className="opp-sidebar-tabsection">{children}</div>;
};

export default TopologySideBarTabSection;
