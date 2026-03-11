import type { ReactNode, FC } from 'react';
import { useState } from 'react';
import { ExpandableSection } from '@patternfly/react-core';

interface ExpandCollapseProps {
  children?: ReactNode;
  textExpanded: string;
  textCollapsed: string;
  onToggle?: (isExpanded: boolean) => void;
  dataTest?: string;
}

export const ExpandCollapse: FC<ExpandCollapseProps> = ({
  textCollapsed,
  textExpanded,
  onToggle,
  dataTest,
  children,
}) => {
  const [isExpanded, toggleExpandCollapse] = useState(false);
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
