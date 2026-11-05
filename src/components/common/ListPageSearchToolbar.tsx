import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import type { FC, ReactNode } from 'react';

type ListPageSearchToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  actions?: ReactNode;
};

export const ListPageSearchToolbar: FC<ListPageSearchToolbarProps> = ({
  value,
  onChange,
  placeholder,
  actions,
}) => (
  <Toolbar>
    <ToolbarContent>
      <ToolbarGroup>
        <ToolbarItem>
          <SearchInput
            value={value}
            onChange={(_event, nextValue) => onChange(nextValue)}
            onClear={() => onChange('')}
            placeholder={placeholder}
          />
        </ToolbarItem>
      </ToolbarGroup>
      {actions && (
        <ToolbarGroup align={{ default: 'alignEnd' }}>{actions}</ToolbarGroup>
      )}
    </ToolbarContent>
  </Toolbar>
);
