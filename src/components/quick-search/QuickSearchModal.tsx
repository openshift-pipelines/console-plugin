import type { SetStateAction, Dispatch, FC } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Radio,
  Divider,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Content,
  ContentVariants,
  Spinner,
  Stack,
  StackItem,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Nav,
  NavList,
  NavItem,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
  ButtonVariant,
  Bullseye,
  Select,
  SelectOption,
  MenuToggle,
  InputGroup,
  InputGroupText,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import RhMicronsCloseIcon from '@patternfly/react-icons/dist/esm/icons/rh-microns-close-icon';
import {
  CatalogItem,
  ResourceIcon,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { DetailsRendererFunction } from './QuickSearchDetails';
import { handleCta } from './utils/quick-search-utils';
import { CatalogType } from '../catalog/types';
import { TaskSearchCallback } from '../pipeline-builder/types';
import { PipelineModel, TaskModel } from '../../models';
import { useTranslation } from 'react-i18next';
import QuickSearchDetails from './QuickSearchDetails';
import './QuickSearchModal.scss';

export type SearchKind = 'Task' | 'Pipeline';
export type QuickSearchAddHandler = () => void;

export interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  searchPlaceholder: string;
  detailsRenderer?: DetailsRendererFunction;
  callback?: TaskSearchCallback;
  setFailedTasks?: Dispatch<SetStateAction<string[]>>;
  isDevConsoleProxyAvailable: boolean;
  showPipelineKind: boolean;
  items: CatalogItem[] | null;
  catalogTypes: CatalogType[];
  isLoading: boolean;
  isSearchError: boolean;
  showEmpty: boolean;
  kind: SearchKind;
  onKindChange: (kind: SearchKind) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  namespaces: string[];
  namespacesLoaded: boolean;
  selectedNamespace: string | null;
  onNamespaceChange: (namespace: string | null) => void;
}

const QuickSearchModal: FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchPlaceholder,
  detailsRenderer,
  callback,
  setFailedTasks,
  isDevConsoleProxyAvailable,
  showPipelineKind,
  items,
  catalogTypes,
  isLoading,
  isSearchError,
  showEmpty,
  kind,
  onKindChange,
  searchTerm,
  onSearchChange,
  namespaces,
  namespacesLoaded,
  selectedNamespace,
  onNamespaceChange,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [detailsReady, setDetailsReady] = useState(true);
  const [isNsSelectOpen, setIsNsSelectOpen] = useState(false);

  const selectedVersionRef = useRef<string>('');
  const selectedItemRef = useRef<CatalogItem | null>(null);

  selectedVersionRef.current = selectedVersion;

  const selectedItem = useMemo(
    () =>
      items?.find((item) => item.uid === selectedItemId) ?? items?.[0] ?? null,
    [items, selectedItemId],
  );

  selectedItemRef.current = selectedItem;

  const canAdd = !!selectedItem && detailsReady;

  const handleClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleAdd = useCallback(() => {
    const item = selectedItemRef.current;
    if (!item) return;
    handleClose();
    handleCta({ preventDefault() {} } as any, item, () => {}, navigate, {
      selectedVersion: selectedVersionRef.current,
      selectedItem: item,
      isDevConsoleProxyAvailable,
      namespace,
      callback,
      setFailedTasks,
    });
  }, [
    handleClose,
    navigate,
    isDevConsoleProxyAvailable,
    namespace,
    callback,
    setFailedTasks,
  ]);

  const getIndexOfSelectedItem = useCallback(
    () => items?.findIndex((item) => item.uid === selectedItem?.uid) ?? -1,
    [items, selectedItem],
  );

  const selectPrevious = useCallback(() => {
    if (!items?.length) return;
    const index = getIndexOfSelectedItem();
    const prevIndex = index <= 0 ? items.length - 1 : index - 1;
    setSelectedItemId(items[prevIndex]?.uid ?? '');
  }, [items, getIndexOfSelectedItem]);

  const selectNext = useCallback(() => {
    if (!items?.length) return;
    const index = getIndexOfSelectedItem();
    const nextIndex = index < 0 || index >= items.length - 1 ? 0 : index + 1;
    setSelectedItemId(items[nextIndex]?.uid ?? '');
  }, [items, getIndexOfSelectedItem]);

  const resultCount = items?.length ?? 0;
  const listAriaLabel = kind === 'Task' ? t('Task list') : t('Pipeline list');

  useEffect(() => {
    setSelectedItemId('');
    setSelectedVersion('');
  }, [kind]);

  useEffect(() => {
    setSelectedItemId('');
  }, [items]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'Enter':
          e.preventDefault();
          if (canAdd) handleAdd();
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose, selectNext, selectPrevious, canAdd, handleAdd]);

  if (!isOpen) return null;

  return (
    <Modal
      variant="medium"
      maxWidth="min(90vw, 760px)"
      aria-labelledby="quick-search-modal-title"
      isOpen
    >
      <ModalHeader
        title={showPipelineKind ? t('Select') : t('Select Task')}
        labelId="quick-search-modal-title"
      />
      <Divider />
      <ModalBody className="pipelines-console-plugin-quick-search-modal__body">
        <Stack>
          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              className="pf-v6-u-px-md pf-v6-u-mb-md"
            >
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsMd' }}
              >
                {showPipelineKind && (
                  <>
                    <FlexItem>
                      <Radio
                        id="kind-task"
                        name="kind"
                        label={t('Task')}
                        isChecked={kind === 'Task'}
                        onChange={() => onKindChange('Task')}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Radio
                        id="kind-pipeline"
                        name="kind"
                        label={t('Pipeline')}
                        isChecked={kind === 'Pipeline'}
                        onChange={() => onKindChange('Pipeline')}
                      />
                    </FlexItem>
                  </>
                )}
              </Flex>

              <FlexItem align={{ default: 'alignRight' }}>
                <InputGroup>
                  <InputGroupText>{t('Project')}</InputGroupText>
                  <Select
                    isOpen={isNsSelectOpen}
                    maxMenuHeight="300px"
                    onOpenChange={setIsNsSelectOpen}
                    selected={selectedNamespace}
                    onSelect={(_e, value) => {
                      onNamespaceChange(value as string);
                      setIsNsSelectOpen(false);
                    }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsNsSelectOpen((open) => !open)}
                        isExpanded={isNsSelectOpen}
                        isDisabled={!namespacesLoaded}
                      >
                        {selectedNamespace || t('Select a namespace')}
                      </MenuToggle>
                    )}
                  >
                    {namespaces.map((ns) => (
                      <SelectOption key={ns} value={ns}>
                        {ns}
                      </SelectOption>
                    ))}
                  </Select>
                </InputGroup>
              </FlexItem>
            </Flex>
          </StackItem>

          <StackItem>
            <TextInputGroup
              isPlain
              className="pipelines-console-plugin-quick-search-modal__search pf-v6-u-mb-md"
            >
              <TextInputGroupMain
                icon={<SearchIcon />}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(_, val) => onSearchChange(val)}
                aria-label={searchPlaceholder}
                inputProps={{ autoFocus: true }}
              />
              {searchTerm && (
                <TextInputGroupUtilities>
                  <Button
                    className="pf-v6-u-mr-sm"
                    variant={ButtonVariant.plain}
                    aria-label={t('Clear')}
                    onClick={() => onSearchChange('')}
                    icon={<RhMicronsCloseIcon size={1} />}
                  />
                </TextInputGroupUtilities>
              )}
            </TextInputGroup>
          </StackItem>

          <StackItem className="pf-v6-u-p-md pf-v6-u-pt-0">
            <Content component={ContentVariants.small}>
              {isLoading ? (
                <Spinner size="md" aria-label={t('Loading')} />
              ) : isSearchError ? (
                t('Unable to show results at the moment')
              ) : (
                `${resultCount} ${
                  kind === 'Task' ? t('Tasks') : t('Pipelines')
                }`
              )}
            </Content>
          </StackItem>

          <Divider />
          {showEmpty ? (
            <Bullseye>
              <EmptyState headingLevel="h5" icon={SearchIcon}>
                <EmptyStateBody>
                  {t('No results found')}
                  <br />
                  {t('Please try a different search term.')}
                </EmptyStateBody>
              </EmptyState>
            </Bullseye>
          ) : (
            <StackItem isFilled>
              <Flex
                className="pipelines-console-plugin-quick-search-modal__split"
                direction={{ default: 'row' }}
              >
                <FlexItem
                  className="pipelines-console-plugin-quick-search-modal__split-pane"
                  flex={{ default: 'flex_1' }}
                >
                  <Nav aria-label={listAriaLabel}>
                    <NavList>
                      {(items || []).map((item) => {
                        const itemType =
                          catalogTypes.find((type) => type.value === item.type)
                            ?.label || item.type;
                        const isItemActive = item.uid === selectedItem?.uid;
                        return (
                          <NavItem
                            key={item.uid}
                            itemId={item.uid}
                            isActive={isItemActive}
                            preventDefault
                            component="button"
                            onClick={() => setSelectedItemId(item.uid)}
                            className={`pipelines-console-plugin-quick-search-modal__navitem ${
                              isItemActive
                                ? 'pipelines-console-plugin-quick-search-modal__navitem__active'
                                : ''
                            }`}
                          >
                            <Grid>
                              <GridItem span={2} rowSpan={2}>
                                <ResourceIcon
                                  groupVersionKind={getGroupVersionKindForModel(
                                    kind === 'Pipeline'
                                      ? PipelineModel
                                      : TaskModel,
                                  )}
                                />
                              </GridItem>

                              <GridItem span={10}>
                                <div className="pipelines-console-plugin-quick-search-modal__navitem__textellipsis">
                                  {item.name}
                                </div>
                              </GridItem>

                              <GridItem span={10}>
                                <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                                  <FlexItem>
                                    <Label isCompact>{itemType}</Label>
                                  </FlexItem>

                                  {item.provider && (
                                    <FlexItem>
                                      <Label isCompact variant="outline">
                                        {item.provider}
                                      </Label>
                                    </FlexItem>
                                  )}
                                </Flex>
                              </GridItem>
                            </Grid>
                          </NavItem>
                        );
                      })}
                    </NavList>
                  </Nav>
                </FlexItem>

                <Divider orientation={{ default: 'vertical' }} />

                <FlexItem
                  className="pipelines-console-plugin-quick-search-modal-split__pane"
                  flex={{ default: 'flex_2' }}
                >
                  {selectedItem && (
                    <QuickSearchDetails
                      kind={kind}
                      detailsRenderer={detailsRenderer}
                      selectedItem={selectedItem}
                      closeModal={handleClose}
                      namespace={namespace}
                      callback={callback}
                      setFailedTasks={setFailedTasks}
                      hideCta
                      onSelectedVersionChange={setSelectedVersion}
                      onDetailsReadyChange={setDetailsReady}
                    />
                  )}
                </FlexItem>
              </Flex>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <Divider />
      <ModalFooter>
        <Button
          variant="primary"
          data-test="task-cta"
          isDisabled={!canAdd}
          onClick={handleAdd}
        >
          {t('Add')}
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default QuickSearchModal;
