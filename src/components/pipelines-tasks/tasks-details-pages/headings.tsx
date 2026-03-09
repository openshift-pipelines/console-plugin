/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from 'react';
import classNames from 'classnames';
import { Title } from '@patternfly/react-core';

export type SectionHeadingProps = {
  children?: any;
  style?: any;
  text: string;
  required?: boolean;
  id?: string;
};

export type SidebarSectionHeadingProps = {
  children?: any;
  style?: any;
  className?: string;
  text: string;
};

export const SectionHeading: FC<SectionHeadingProps> = ({
  text,
  children,
  style,
  required,
  id,
}) => (
  <h2
    className="co-section-heading"
    style={style}
    data-test-section-heading={text}
    id={id}
  >
    <span
      className={classNames({
        'co-required': required,
      })}
    >
      {text}
    </span>
    {children}
  </h2>
);

export const SidebarSectionHeading: FC<SidebarSectionHeadingProps> = ({
  text,
  children,
  style,
  className,
}) => (
  <Title
    headingLevel="h2"
    className={`sidebar__section-heading ${className}`}
    style={style}
  >
    {text}
    {children}
  </Title>
);
