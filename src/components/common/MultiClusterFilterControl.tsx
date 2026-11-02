import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { CircleIcon, TimesIcon } from '@patternfly/react-icons';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';
import {
  isClusterConnected,
  useMultiKueueClusters,
} from '../hooks/useMultiKueueResources';

export type MultiClusterFilterControlProps = {
  selected: string;
  onSelect: (cluster: string) => void;
};

export const MultiClusterFilterControl: FC<MultiClusterFilterControlProps> = ({
  selected,
  onSelect,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isHub } = useMultiClusterProxyService({});
  const [clusters, loaded, clustersError] = useMultiKueueClusters();
  const [isOpen, setIsOpen] = useState(false);

  const clusterItems = useMemo(
    () =>
      (clusters ?? []).map((c) => ({
        name: c.metadata?.name ?? '',
        connected: isClusterConnected(c),
      })),
    [clusters],
  );

  const handleSelect = useCallback(
    (name: string) => {
      onSelect(name);
      setIsOpen(false);
    },
    [onSelect],
  );

  if (!isHub) {
    return null;
  }

  if (clustersError) {
    return (
      <ToolbarItem>
        <Alert
          variant="danger"
          isInline
          isPlain
          title={t('Unable to load target cluster information')}
        />
      </ToolbarItem>
    );
  }

  const isLoading = !loaded;
  const isDisabled = loaded && clusterItems.length === 0;
  const label = selected || t('All Clusters');
  const tooltipContent = isDisabled
    ? t('No MultiKueue clusters available')
    : t('Filter by spoke cluster');

  return (
    <ToolbarItem>
      <Flex
        spaceItems={{ default: 'spaceItemsMd' }}
        alignItems={{ default: 'alignItemsCenter' }}
      >
        <FlexItem>
          <Tooltip
            content={tooltipContent}
            trigger={isDisabled ? 'mouseenter focus' : ''}
          >
            <span>
              <Select
                isOpen={isOpen && !isDisabled && !isLoading}
                onOpenChange={(v) => !v && setIsOpen(false)}
                onSelect={(_e, value) => handleSelect(value as string)}
                selected={selected || undefined}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsOpen((v) => !v)}
                    isExpanded={isOpen}
                    isDisabled={isDisabled || isLoading}
                    icon={
                      isLoading ? (
                        <Spinner size="sm" aria-label={t('Loading clusters')} />
                      ) : undefined
                    }
                  >
                    {label}
                    {selected && (
                      <Button
                        variant="plain"
                        aria-label={t('Clear cluster filter')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect('');
                        }}
                        className="pipelines-console-plugin-clear-filter pf-v6-u-p-0"
                      >
                        <TimesIcon className="pf-v6-u-p-0 pf-v6-u-m-0" />
                      </Button>
                    )}
                  </MenuToggle>
                )}
                isScrollable
              >
                <SelectList>
                  <SelectOption value="">{t('All Clusters')}</SelectOption>
                  {clusterItems.map((item) => (
                    <SelectOption
                      key={item.name}
                      value={item.name}
                      icon={
                        <CircleIcon
                          color={
                            item.connected
                              ? 'var(--pf-t--global--icon--color--status--success--default)'
                              : 'var(--pf-t--global--icon--color--status--danger--default)'
                          }
                        />
                      }
                    >
                      {item.name}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </span>
          </Tooltip>
        </FlexItem>
        {/* Status legend */}
        <FlexItem>
          <Flex
            spaceItems={{ default: 'spaceItemsMd' }}
            alignItems={{ default: 'alignItemsCenter' }}
            aria-label={t('Cluster status legend')}
          >
            <FlexItem>
              <Flex
                spaceItems={{ default: 'spaceItemsXs' }}
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <FlexItem>
                  <CircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />
                </FlexItem>
                <FlexItem>{t('Connected')}</FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Flex
                spaceItems={{ default: 'spaceItemsXs' }}
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <FlexItem>
                  <CircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />
                </FlexItem>
                <FlexItem>{t('Disconnected')}</FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </ToolbarItem>
  );
};
