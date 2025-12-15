import * as React from 'react';
import { PageSection } from '@patternfly/react-core';

const PaneBody: React.FC<PaneBodyProps> = ({
  children,
  className,
  fullHeight,
  sectionHeading,
  style,
  ...props
}) => {
  return (
    <PageSection hasBodyWrapper={false}
      className={className}
      isFilled={fullHeight}
      style={style}
      {...props}
    >
      {children}
    </PageSection>
  );
};

export type PaneBodyProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  sectionHeading?: boolean;
  style?: React.CSSProperties;
};

export default PaneBody;
