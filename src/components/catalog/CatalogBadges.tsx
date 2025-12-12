import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CatalogItemBadge } from '@openshift-console/dynamic-plugin-sdk';
import './CatalogBadges.scss';

type CatalogBadgesProps = {
  badges: CatalogItemBadge[];
};

const CatalogBadges: React.FC<CatalogBadgesProps> = ({ badges }) => (
  <div className="odc-catalog-badges">
    {badges?.map((badge, index) => (
      <Label
        className="odc-catalog-badges__label"
        color={badge.color === 'cyan' ? 'blue' : (badge.color as any)}
        icon={badge.icon}
        variant={badge.variant}
        key={index}
      >
        {badge.text}
      </Label>
    ))}
  </div>
);

export default CatalogBadges;
