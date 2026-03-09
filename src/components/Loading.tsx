import type { FC } from 'react';
import { Bullseye, Spinner, SpinnerProps } from '@patternfly/react-core';

type LoadingProps = {
  className?: string;
  isInline?: boolean;
  size?: SpinnerProps['size'];
  ariaLabel?: string;
};

export const Loading: FC<LoadingProps> = ({
  className,
  isInline,
  size,
  ariaLabel,
}) => (
  <Bullseye data-test="loading-indicator" className={className}>
    <Spinner size={size} isInline={isInline} aria-label={ariaLabel} />
  </Bullseye>
);
Loading.displayName = 'Loading';

export const LoadingInline: FC = () => <Loading isInline={true} />;
LoadingInline.displayName = 'LoadingInline';
