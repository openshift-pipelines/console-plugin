import type { FunctionComponent, MouseEvent, ReactNode, Ref } from 'react';
import { Decorator as PfDecorator } from '@patternfly/react-topology';
import { Link } from 'react-router';
import { CustomSVGDefsProvider } from './CustomSVGDefsProvider';

import './Decorator.scss';

type DecoratorTypes = {
  children?: ReactNode;
  x: number;
  y: number;
  radius: number;
  onClick?(event: MouseEvent<SVGGElement>): void;
  href?: string;
  ariaLabel?: string;
  external?: boolean;
  circleRef?: Ref<SVGCircleElement>;
};

const Decorator: FunctionComponent<DecoratorTypes> = ({
  x,
  y,
  radius,
  href,
  ariaLabel,
  external,
  ...rest
}) => {
  const decorator = (
    <CustomSVGDefsProvider>
      <PfDecorator
        x={x}
        y={y}
        radius={radius}
        className="opp-decorator"
        showBackground
        {...rest}
      />
    </CustomSVGDefsProvider>
  );

  if (href) {
    return external ? (
      <a
        className="opp-decorator__link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
        }}
        role="button"
        aria-label={ariaLabel}
      >
        {decorator}
      </a>
    ) : (
      <Link
        className="opp-decorator__link"
        to={href}
        role="button"
        aria-label={ariaLabel}
      >
        {decorator}
      </Link>
    );
  }
  return decorator;
};

export default Decorator;
