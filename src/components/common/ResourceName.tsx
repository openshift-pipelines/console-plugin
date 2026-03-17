import {
  K8sResourceKindReference,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};

export const ResourceName: FC<ResourceNameProps> = (props) => (
  <span className="co-resource-item">
    <ResourceIcon kind={props.kind} />{' '}
    <span className="co-resource-item__resource-name">{props.name}</span>
  </span>
);
