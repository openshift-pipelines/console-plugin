import type { FC, ReactNode, CSSProperties } from 'react';
import { PageSection } from '@patternfly/react-core';

const PaneBody: FC<PaneBodyProps> = ({
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
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
  sectionHeading?: boolean;
  style?: CSSProperties;
};

export default PaneBody;
