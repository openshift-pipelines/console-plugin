import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CatalogItemBadge } from '@openshift-console/dynamic-plugin-sdk';
import './CatalogBadges.scss';

type CatalogBadgesProps = {
  badges: CatalogItemBadge[];
};

const CatalogBadges: React.FC<CatalogBadgesProps> = ({ badges }) => (
  <div className="odc-catalog-badges">
    {badges?.map((badge, index) => {
      // Map colors for PF6 compatibility
      const validColors = ['blue', 'teal', 'green', 'orange', 'purple', 'red', 'grey'];
      const color = badge.color as string;
      // Map cyan to blue, and default any invalid color to blue
      const validColor = validColors.includes(color)
        ? color
        : color === 'cyan'
          ? 'blue'
          : 'blue';
      return (
        <Label
          className="odc-catalog-badges__label"
          color={validColor as any}
          icon={badge.icon}
          variant={badge.variant}
          key={index}
        >
          {badge.text}
        </Label>
      );
    })}
  </div>
);

export default CatalogBadges;
