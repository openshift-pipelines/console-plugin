import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  MenuActions,
  MenuAction,
  SecondaryButtonAction,
} from './multi-tab-list-page-types';
import { useHistory } from 'react-router';
import { getReferenceForModel } from '../pipelines-overview/utils';
import {
  HorizontalNav,
  ListPageCreateDropdown,
  ListPageHeader,
  NavPage,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageTitleContext } from './PageTitleContext';
import './MultiTabListPage.scss';

interface MultiTabListPageProps {
  title: string;
  badge?: React.ReactNode;
  menuActions?: MenuActions;
  pages: NavPage[];
  secondaryButtonAction?: SecondaryButtonAction;
  telemetryPrefix?: string;
}

const MultiTabListPage: React.FC<MultiTabListPageProps> = ({
  title,
  badge,
  pages,
  menuActions,
  telemetryPrefix,
}) => {
  const { t } = useTranslation();
  const { ns } = useParams();
  const history = useHistory();

  const onSelectCreateAction = (actionName: string) => {
    const selectedMenuItem: MenuAction = menuActions[actionName];
    let url: string;
    if (selectedMenuItem.model) {
      const namespace = ns ?? 'default';
      const modelRef = getReferenceForModel(selectedMenuItem.model);
      url = namespace
        ? `/k8s/ns/${namespace}/${modelRef}/~new`
        : `/k8s/cluster/${modelRef}/~new`;
    }
    if (selectedMenuItem.onSelection) {
      url = selectedMenuItem.onSelection(actionName, selectedMenuItem, url);
    }
    if (url) {
      history.push(url);
    }
  };

  const items = menuActions
    ? Object.keys(menuActions).reduce<Record<string, string>>((acc, key) => {
        const menuAction: MenuAction = menuActions[key];
        const label =
          menuAction.label ||
          (menuAction.model?.labelKey
            ? t(menuAction.model.labelKey)
            : menuAction.model?.label);
        if (!label) return acc;

        return {
          ...acc,
          [key]: label,
        };
      }, {})
    : undefined;

  const titleProviderValues = {
    telemetryPrefix,
    titlePrefix: title,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <ListPageHeader title={title} badge={badge}>
        <ListPageCreateDropdown items={items} onClick={onSelectCreateAction}>
          {t('Create')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <HorizontalNav pages={pages} />
    </PageTitleContext.Provider>
  );
};

export default MultiTabListPage;
