import { SearchInput } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

type SearchInputProps = {
  pageFlag: number;
  handleNameChange: (searchKeyword: string) => void;
  searchText: string;
};

const SearchInputField: React.FC<SearchInputProps> = ({
  pageFlag,
  handleNameChange,
  searchText,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <SearchInput
      value={searchText}
      className="pf-v6-u-ml-sm pf-v6-u-w-25"
      placeholder={
        pageFlag === 1
          ? t('Search by pipeline name')
          : t('Search by repository name')
      }
      onChange={(event, text) => handleNameChange(text)}
      onClear={() => handleNameChange('')}
    />
  );
};

export default SearchInputField;
