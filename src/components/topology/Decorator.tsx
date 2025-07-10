import * as React from 'react';
import { Decorator as PfDecorator } from '@patternfly/react-topology';
import { Link } from 'react-router-dom-v5-compat';
import { CustomSVGDefsProvider } from './CustomSVGDefsProvider';

import './Decorator.scss';

type DecoratorTypes = {
  x: number;
  y: number;
  radius: number;
  onClick?(event: React.MouseEvent<SVGGElement, MouseEvent>): void;
  href?: string;
  ariaLabel?: string;
  external?: boolean;
  circleRef?: React.Ref<SVGCircleElement>;
};

const Decorator: React.FunctionComponent<DecoratorTypes> = ({
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
