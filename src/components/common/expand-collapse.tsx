import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';

interface ExpandCollapseProps {
  textExpanded: string;
  textCollapsed: string;
  onToggle?: (isExpanded: boolean) => void;
  dataTest?: string;
}

export const ExpandCollapse: React.FC<ExpandCollapseProps> = ({
  textCollapsed,
  textExpanded,
  onToggle,
  dataTest,
  children,
}) => {
  const [isExpanded, toggleExpandCollapse] = React.useState(false);
  return (
    <ExpandableSection
      toggleText={isExpanded ? textExpanded : textCollapsed}
      onToggle={(_event, expanded) => {
        onToggle?.(expanded);
        toggleExpandCollapse(expanded);
      }}
      isExpanded={isExpanded}
      data-test={dataTest}
    >
      {children}
    </ExpandableSection>
  );
};
