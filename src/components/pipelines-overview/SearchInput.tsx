import { SearchInput } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const SearchInputField = ({ pageFlag }) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return (
    <SearchInput
      className="pipeline-overview__search-input"
      placeholder={pageFlag === 1 ? t('Search by pipeline name') : t('Search by repository name')}
    />
  );
};

export default SearchInputField;
