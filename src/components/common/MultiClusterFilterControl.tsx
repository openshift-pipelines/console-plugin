import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Spinner,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { CircleIcon } from '@patternfly/react-icons';
import { useMultiClusterProxyService } from '../hooks/useMultiClusterProxyService';
import { useMultiKueueClusters } from '../hooks/useMultiKueueResources';
import { MultiKueueClusterKind } from '../../types';

const isClusterConnected = (cluster: MultiKueueClusterKind): boolean =>
  cluster.status?.conditions?.some(
    (c) => c.type === 'Active' && c.status === 'True',
  ) ?? false;

export const MultiClusterFilterControl: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { isHub } = useMultiClusterProxyService({});
  const [clusters, loaded] = useMultiKueueClusters();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clusterItems = useMemo(
    () =>
      (clusters ?? []).map((c) => ({
        name: c.metadata?.name ?? '',
        connected: isClusterConnected(c),
      })),
    [clusters],
  );

  if (!isHub) {
    return null;
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
              <Dropdown
                isOpen={isOpen && !isDisabled && !isLoading}
                onOpenChange={(v) => setIsOpen(v)}
                onSelect={close}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={toggleOpen}
                    isExpanded={isOpen}
                    isDisabled={isDisabled || isLoading}
                    icon={
                      isLoading ? (
                        <Spinner size="sm" aria-label={t('Loading clusters')} />
                      ) : undefined
                    }
                  >
                    {label}
                  </MenuToggle>
                )}
                isScrollable
              >
                <DropdownList>
                  <DropdownItem
                    component="button"
                    key="__all__"
                    onClick={() => setSelected('')}
                  >
                    {t('All Clusters')}
                  </DropdownItem>
                  {clusterItems.map((item) => (
                    <DropdownItem
                      component="button"
                      key={item.name}
                      onClick={() => setSelected(item.name)}
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
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </span>
          </Tooltip>
        </FlexItem>
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
