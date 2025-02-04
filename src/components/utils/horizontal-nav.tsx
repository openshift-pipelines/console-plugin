/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavPage } from '@openshift-console/dynamic-plugin-sdk';
import { t } from './common-utils';

type NavFactory = { [name: string]: (c?: React.ComponentType<any>) => NavPage };
export const navFactory: NavFactory = {
  details: (component) => ({
    href: '',
    name: t('Details'),
    component,
  }),
  events: (component) => ({
    href: 'events',
    name: t('Events'),
    component,
  }),
  editYaml: (component) => ({
    href: 'yaml',
    name: t('YAML'),
    component,
  }),
};
