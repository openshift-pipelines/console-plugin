import * as React from 'react';
import {
  Bullseye,
  InputGroup,
  InputGroupText,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchIcon from './QuickSearchIcon';
import './QuickSearchBar.scss';

interface QuickSearchBarProps {
  showNoResults: boolean;
  itemsLoaded: boolean;
  autoFocus: boolean;
  searchTerm: string;
  onSearch: (
    event: React.FormEvent<HTMLInputElement>,
    searchTerm: string,
  ) => void;
  searchPlaceholder: string;
  icon?: React.ReactNode;
  showError: boolean;
}

const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  showNoResults,
  itemsLoaded,
  autoFocus = false,
  searchTerm,
  searchPlaceholder,
  onSearch,
  icon,
  showError
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  return (
    <InputGroup
      onClick={() => inputRef.current?.focus()}
      className="ocs-quick-search-bar"
      data-test="quick-search-bar"
    >
      <Bullseye className="ocs-quick-search-bar__icon">
        <InputGroupText isPlain >
          {icon || <QuickSearchIcon />}
        </InputGroupText>
      </Bullseye>
      <div className="ocs-quick-search-bar__input-wrapper">
        {/* <span> is only used to calculate the width of input based on the text in search */}
        <span className="ocs-quick-search-bar__input-dummy" ref={spanRef}>
          {searchTerm?.length >= searchPlaceholder.length
            ? searchTerm.replace(/ /g, '\u00a0')
            : searchPlaceholder}
        </span>
        <TextInput
          type="text"
          ref={inputRef}
          aria-label={t('Quick search bar')}
          className="ocs-quick-search-bar__input"
          placeholder={searchPlaceholder}
          onChange={onSearch}
          autoFocus={autoFocus}
          value={searchTerm}
          data-test="input"
          style={{
            width: spanRef.current?.offsetWidth
              ? spanRef.current?.offsetWidth + 2
              : '0px',
          }}
        />
        {itemsLoaded && showNoResults && (
          <InputGroupText
            isPlain
            className="ocs-quick-search-bar__message ocs-quick-search-bar__border-none"
            data-test="quick-search-no-results"
          >
            &mdash; {t('No results')}
          </InputGroupText>
        )}
        {showError && (
          <InputGroupText
            isPlain
            className="ocs-quick-search-bar__message ocs-quick-search-bar__border-none"
          >
            &mdash; {t('Unable to show results at the moment')}
          </InputGroupText>
        )}
      </div>
      {!itemsLoaded && (
        <InputGroupText isPlain className="ocs-quick-search-bar__spinner">
          <Spinner size="lg" />
        </InputGroupText>
      )}
    </InputGroup>
  );
};

export default QuickSearchBar;
