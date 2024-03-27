/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavPage } from '@openshift-console/dynamic-plugin-sdk';

type NavFactory = { [name: string]: (c?: React.ComponentType<any>) => NavPage };
export const navFactory: NavFactory = {
  details: (component) => ({
    href: '',
    // t('Details')
    name: 'Details',
    component,
  }),
  events: (component) => ({
    href: 'events',
    // t('Events')
    name: 'Events',
    component,
  }),
  editYaml: (component) => ({
    href: 'yaml',
    // t('YAML')
    name: 'YAML',
    component,
  }),
};
