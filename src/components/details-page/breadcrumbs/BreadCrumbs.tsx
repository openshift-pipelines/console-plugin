import type { ReactElement, PropsWithChildren, FC } from 'react';
import { isValidElement, Fragment } from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

type BreadCrumbsProps = {
  breadcrumbs: ({ name: string; path: string } | ReactElement)[];
  className?: string;
};

export const BreadCrumbs: FC<
  PropsWithChildren<BreadCrumbsProps>
> = ({ breadcrumbs, className }) => (
  <Breadcrumb className={className}>
    {breadcrumbs.map((crumb, i, { length }) => {
      const isLast = i === length - 1;

      if (isValidElement(crumb)) {
        return <Fragment key={crumb.key}>{crumb}</Fragment>;
      }

      const crumbData = crumb as { name: string; path: string };
      return (
        <BreadcrumbItem key={crumbData.name} component="div" isActive={isLast}>
          {isLast || !crumbData.path ? (
            crumbData.name
          ) : (
            <Link
              className="pf-v6-c-breadcrumb__link"
              to={crumbData.path}
              data-test-id={`breadcrumb-link-${i}`}
            >
              {crumbData.name}
            </Link>
          )}
        </BreadcrumbItem>
      );
    })}
  </Breadcrumb>
);

export default BreadCrumbs;
