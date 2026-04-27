import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
  Popper,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
export interface FilterOption {
  value: string;
  label: string;
  count: number;
  totalCount?: number;
}

export interface CheckboxFilterConfig {
  id: string;
  title: string;
  placeholder?: string;
  options: FilterOption[];
  defaultValues?: string[];
}

export interface FilterValues {
  name: string;
  labels: string[];
  [key: string]: string | string[];
}

interface DataViewFilterToolbarProps {
  filterValues: FilterValues;
  onFilterChange: (key: string, value: string | string[]) => void;
  onClearAll: () => void;
  checkboxFilters?: CheckboxFilterConfig[];
  hideNameFilter?: boolean;
  hideLabelFilter?: boolean;
  children?: ReactNode;
}

interface FilterCategory {
  id: string;
  title: string;
}

const CheckboxFilterInput: FC<{
  config: CheckboxFilterConfig;
  selected: string[];
  onSelect: (values: string[]) => void;
}> = ({ config, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minWidth, setMinWidth] = useState<number>(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const onMenuSelect = (_event: unknown, itemId: string | number) => {
    const id = String(itemId);
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onSelect(newSelected);
  };

  useEffect(() => {
    // Set the minimum width of the menu to the width of the menu
    if (isOpen && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      setMinWidth(menuWidth);
    }
  }, [isOpen, minWidth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !menuRef.current?.contains(event.target as Node) &&
        !toggleRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      <Popper
        trigger={
          <MenuToggle
            ref={toggleRef}
            onClick={handleToggleClick}
            isExpanded={isOpen}
            isFullWidth
            icon={<FilterIcon />}
            badge={
              selected.length > 0 ? (
                <Badge isRead>{selected.length}</Badge>
              ) : undefined
            }
          >
            {config.placeholder || config.title}
          </MenuToggle>
        }
        triggerRef={toggleRef}
        popper={
          <Menu
            ref={menuRef}
            onSelect={onMenuSelect}
            selected={selected}
            style={minWidth ? { minWidth } : undefined}
          >
            <MenuContent>
              <MenuList>
                {config.options.map((option) => (
                  <MenuItem
                    key={option.value}
                    itemId={option.value}
                    hasCheckbox
                    isSelected={selected.includes(option.value)}
                  >
                    {option.label}
                    <Badge isRead className="pf-v6-u-ml-sm">
                      {option.totalCount !== undefined
                        ? `${option.count}/${option.totalCount}`
                        : option.count}
                    </Badge>
                  </MenuItem>
                ))}
              </MenuList>
            </MenuContent>
          </Menu>
        }
        popperRef={menuRef}
        appendTo={containerRef.current || undefined}
        isVisible={isOpen}
      />
    </div>
  );
};

export const DataViewFilterToolbar: FC<DataViewFilterToolbarProps> = ({
  filterValues,
  onFilterChange,
  onClearAll,
  checkboxFilters = [],
  hideNameFilter = false,
  hideLabelFilter = false,
  children,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [labelInput, setLabelInput] = useState('');

  const filterCategories = useMemo<FilterCategory[]>(() => {
    const categories: FilterCategory[] = [];
    if (!hideNameFilter) {
      categories.push({ id: 'name', title: t('Name') });
    }
    if (!hideLabelFilter) {
      categories.push({ id: 'labels', title: t('Label') });
    }
    checkboxFilters.forEach((f) => {
      categories.push({ id: f.id, title: f.title });
    });
    return categories;
  }, [hideNameFilter, hideLabelFilter, checkboxFilters, t]);

  const [activeCategory, setActiveCategory] = useState(
    filterCategories[0]?.title || '',
  );
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categoryMinWidth, setCategoryMinWidth] = useState<number>(0);
  const categoryToggleRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filterCategories.length > 0 && !activeCategory) {
      setActiveCategory(filterCategories[0].title);
    }
  }, [filterCategories, activeCategory]);

  useEffect(() => {
    if (isCategoryMenuOpen && categoryMenuRef.current) {
      const menuWidth = categoryMenuRef.current.offsetWidth;
      if (menuWidth > categoryMinWidth) {
        setCategoryMinWidth(menuWidth);
      }
    }
  }, [isCategoryMenuOpen, categoryMinWidth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCategoryMenuOpen &&
        !categoryMenuRef.current?.contains(event.target as Node) &&
        !categoryToggleRef.current?.contains(event.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isCategoryMenuOpen]);

  const deleteChip = useCallback(
    (filterId: string, chip: string) => {
      const current = filterValues[filterId];
      if (Array.isArray(current)) {
        onFilterChange(
          filterId,
          current.filter((v) => v !== chip),
        );
      } else {
        onFilterChange(filterId, '');
      }
    },
    [filterValues, onFilterChange],
  );

  const deleteChipGroup = useCallback(
    (filterId: string) => {
      const current = filterValues[filterId];
      onFilterChange(filterId, Array.isArray(current) ? [] : '');
    },
    [filterValues, onFilterChange],
  );

  const chipLabels = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    checkboxFilters.forEach((f) => {
      map[f.id] = {};
      f.options.forEach((o) => {
        map[f.id][o.value] = o.label;
      });
    });
    return map;
  }, [checkboxFilters]);

  const categoryToggle = (
    <MenuToggle
      ref={categoryToggleRef}
      onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
      isExpanded={isCategoryMenuOpen}
      isFullWidth
      icon={<FilterIcon />}
    >
      {activeCategory}
    </MenuToggle>
  );

  const categoryMenu = (
    <Menu
      ref={categoryMenuRef}
      onSelect={(_ev, itemId) => {
        const selected = filterCategories.find((c) => c.id === itemId);
        if (selected) setActiveCategory(selected.title);
        setIsCategoryMenuOpen(false);
      }}
    >
      <MenuContent>
        <MenuList>
          {filterCategories.map((cat) => (
            <MenuItem key={cat.id} itemId={cat.id}>
              {cat.title}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <Toolbar
      clearAllFilters={onClearAll}
      customLabelGroupContent={
        <ToolbarItem>
          <Button variant="link" onClick={onClearAll} isInline>
            {t('Clear filters')}
          </Button>
        </ToolbarItem>
      }
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            {filterCategories.length > 1 && (
              <div
                ref={categoryContainerRef}
                style={
                  categoryMinWidth ? { minWidth: categoryMinWidth } : undefined
                }
              >
                <Popper
                  trigger={categoryToggle}
                  triggerRef={categoryToggleRef}
                  popper={categoryMenu}
                  popperRef={categoryMenuRef}
                  appendTo={categoryContainerRef.current || undefined}
                  isVisible={isCategoryMenuOpen}
                />
              </div>
            )}
            {!hideNameFilter && (
              <ToolbarFilter
                labels={filterValues.name ? [filterValues.name] : []}
                deleteLabel={() => onFilterChange('name', '')}
                deleteLabelGroup={() => onFilterChange('name', '')}
                categoryName={t('Name')}
                showToolbarItem={activeCategory === t('Name')}
              >
                <SearchInput
                  placeholder={t('Filter by name')}
                  value={filterValues.name}
                  onChange={(_event, value) => onFilterChange('name', value)}
                  onClear={() => onFilterChange('name', '')}
                />
              </ToolbarFilter>
            )}
            {!hideLabelFilter && (
              <ToolbarFilter
                labels={filterValues.labels || []}
                deleteLabel={(_category, chip) => {
                  const label = typeof chip === 'string' ? chip : '';
                  onFilterChange(
                    'labels',
                    (filterValues.labels || []).filter((l) => l !== label),
                  );
                }}
                deleteLabelGroup={() => onFilterChange('labels', [])}
                categoryName={t('Label')}
                showToolbarItem={activeCategory === t('Label')}
              >
                <SearchInput
                  placeholder={t('Filter by label')}
                  value={labelInput}
                  onChange={(_event, value) => setLabelInput(value)}
                  onClear={() => setLabelInput('')}
                  onKeyUp={(e) => {
                    if (
                      e.key === 'Enter' &&
                      labelInput.trim() &&
                      !(filterValues.labels || []).includes(labelInput.trim())
                    ) {
                      onFilterChange('labels', [
                        ...(filterValues.labels || []),
                        labelInput.trim(),
                      ]);
                      setLabelInput('');
                    }
                  }}
                />
              </ToolbarFilter>
            )}
            {checkboxFilters.map((filterConfig) => {
              const selected =
                (filterValues[filterConfig.id] as string[]) || [];
              return (
                <ToolbarFilter
                  key={filterConfig.id}
                  labels={selected.map((v) => ({
                    key: v,
                    node: chipLabels[filterConfig.id]?.[v] || v,
                  }))}
                  deleteLabel={(_category, chip) => {
                    const chipKey =
                      typeof chip === 'object' && 'key' in chip
                        ? chip.key
                        : String(chip);
                    deleteChip(filterConfig.id, chipKey);
                  }}
                  deleteLabelGroup={() => deleteChipGroup(filterConfig.id)}
                  categoryName={filterConfig.title}
                  showToolbarItem={activeCategory === filterConfig.title}
                >
                  <CheckboxFilterInput
                    config={filterConfig}
                    selected={selected}
                    onSelect={(values) =>
                      onFilterChange(filterConfig.id, values)
                    }
                  />
                </ToolbarFilter>
              );
            })}
          </ToolbarGroup>
        </ToolbarToggleGroup>
        {children && <ToolbarGroup>{children}</ToolbarGroup>}
      </ToolbarContent>
    </Toolbar>
  );
};
