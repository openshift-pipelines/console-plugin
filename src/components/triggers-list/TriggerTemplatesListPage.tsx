import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TriggerTemplateModel } from '../../models';
import TriggerTemplatesList from './TriggerTemplatesList';
import ListPageCreateButton from '../list-pages/ListPageCreateButton';

type TriggerTemplatesListPageProps = {
  namespace: string;
  hideNameLabelFilters?: boolean;
};

const TriggerTemplatesListPage: React.FC<TriggerTemplatesListPageProps> = (
  props,
) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { hideNameLabelFilters, namespace } = props;
  return (
    <>
      {hideNameLabelFilters ? (
        <>
          <ListPageCreateButton
            model={TriggerTemplateModel}
            namespace={namespace}
            hideTitle={hideNameLabelFilters}
          />
          <TriggerTemplatesList {...props} />
        </>
      ) : (
        <>
          <ListPageHeader title={t('TriggerTemplates')}>
            <ListPageCreateButton
              model={TriggerTemplateModel}
              namespace={namespace}
              hideTitle={hideNameLabelFilters}
            />
          </ListPageHeader>
          <TriggerTemplatesList {...props} />
        </>
      )}
    </>
  );
};

export default TriggerTemplatesListPage;
