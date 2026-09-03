import type { FC } from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  ButtonVariant,
  Label,
  LabelGroup,
  Level,
  LevelItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Content,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { getArtifactHubTaskDetails } from '../catalog/apis/artifactHub';
import {
  getCtaButtonText,
  getTaskCtaType,
  isArtifactHubTask,
  isOneVersionInstalled,
  isTaskVersionInstalled,
  TaskProviders,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchTaskAlert from './PipelineQuickSearchTaskAlert';
import PipelineQuickSearchVersionDropdown from './PipelineQuickSearchVersionDropdown';
import { handleCta } from '../quick-search';
import { QuickSearchDetailsRendererProps } from '../quick-search/QuickSearchDetails';
import { FLAGS } from '../../types';

import './PipelineQuickSearchDetails.scss';
import { PipelineModel, TaskModel } from '../../models';
import { QUICK_SEARCH_DETAILS_EXCLUDED_ANNOTATIONS } from './const';

const PipelineQuickSearchDetails: FC<QuickSearchDetailsRendererProps> = ({
  kind,
  selectedItem,
  closeModal,
  namespace,
  callback,
  setFailedTasks,
  hideCta,
  onSelectedVersionChange,
  onDetailsReadyChange,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [selectedVersion, setSelectedVersion] = useState<string>();
  const [versions, setVersions] = useState(
    selectedItem?.attributes?.versions ?? [],
  );
  const [hasInstalledVersion, setHasInstalledVersion] = useState<boolean>(
    isOneVersionInstalled(selectedItem),
  );
  const [detailsLoaded, setDetailsLoaded] = useState<boolean>(
    !isArtifactHubTask(selectedItem),
  );

  useEffect(() => {
    onDetailsReadyChange?.(detailsLoaded);
  }, [detailsLoaded, onDetailsReadyChange]);

  const updateSelectedVersion = useCallback(
    (version: string) => {
      setSelectedVersion(version);
      onSelectedVersionChange?.(version);
    },
    [onSelectedVersionChange],
  );

  const resetVersions = useCallback(() => {
    setVersions(selectedItem?.attributes?.versions ?? []);
    const installed = selectedItem?.attributes?.installed ?? '';
    setSelectedVersion(installed);
    onSelectedVersionChange?.(installed);
    setHasInstalledVersion(isOneVersionInstalled(selectedItem));
  }, [selectedItem, onSelectedVersionChange]);

  const onChangeVersion = useCallback(
    (key) => {
      updateSelectedVersion(key);
      if (isArtifactHubTask(selectedItem)) {
        setDetailsLoaded(false);
        getArtifactHubTaskDetails(selectedItem, key, isDevConsoleProxyAvailable)
          .then((item) => {
            selectedItem.attributes.versions = item.available_versions;
            selectedItem.attributes.selectedVersionContentUrl =
              item.content_url;
            selectedItem.attributes.selectedVersionForContentUrl = key;
            selectedItem.tags = item.keywords;

            setVersions([...item.available_versions]);
            setHasInstalledVersion(isOneVersionInstalled(selectedItem));
            setDetailsLoaded(true);
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Error while getting ArtifactHub Task details:', err);
            resetVersions();
            setDetailsLoaded(true);
          });
      }
    },
    [
      resetVersions,
      selectedItem,
      updateSelectedVersion,
      isDevConsoleProxyAvailable,
    ],
  );

  useEffect(() => {
    resetVersions();
    let mounted = true;

    if (isArtifactHubTask(selectedItem)) {
      setDetailsLoaded(false);
      const debouncedLoadDetails = debounce(async () => {
        if (mounted) {
          try {
            const item = await getArtifactHubTaskDetails(
              selectedItem,
              undefined,
              isDevConsoleProxyAvailable,
            );
            if (mounted) {
              selectedItem.attributes.versions = item.available_versions;
              selectedItem.attributes.selectedVersionContentUrl =
                item.content_url;
              selectedItem.attributes.selectedVersionForContentUrl =
                selectedItem.data?.task?.version?.toString();
              selectedItem.tags = item.keywords;
              setVersions([...item.available_versions]);
              setHasInstalledVersion(isOneVersionInstalled(selectedItem));
              setDetailsLoaded(true);
            }
          } catch (err) {
            if (mounted) {
              resetVersions();
              setDetailsLoaded(true);
            }
          }
        }
      }, 10);
      debouncedLoadDetails();
    } else {
      setDetailsLoaded(true);
    }

    return () => {
      mounted = false;
    };
  }, [resetVersions, selectedItem]);

  useEffect(() => {
    if (isTaskVersionInstalled(selectedItem)) {
      updateSelectedVersion(selectedItem.attributes.installed);
    } else {
      const version =
        selectedItem.data?.latestVersion?.version?.toString() ||
        selectedItem.data?.task?.version?.toString() ||
        '';
      updateSelectedVersion(version);
    }
  }, [selectedItem, updateSelectedVersion]);

  return (
    <div className="opp-quick-search-details">
      <Level hasGutter>
        <LevelItem>
          <Title data-test="task-name" headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        {kind == TaskModel.kind &&
          selectedItem.provider !== TaskProviders.redhat &&
          !hasInstalledVersion && (
            <LevelItem>
              <Label data-test="task-provider">{selectedItem.provider}</Label>
            </LevelItem>
          )}
        {(hasInstalledVersion ||
          selectedItem.provider === TaskProviders.redhat) && (
          <LevelItem>
            <Label
              color="green"
              icon={<CheckCircleIcon />}
              data-test="task-installed-badge"
            >
              {t('Installed')}
            </Label>
          </LevelItem>
        )}
      </Level>
      <Level hasGutter>
        <LevelItem>
          <Split hasGutter>
            {!hideCta && (
              <SplitItem>
                <Button
                  data-test="task-cta"
                  variant={ButtonVariant.primary}
                  className="opp-quick-search-details__form-button"
                  isDisabled={!detailsLoaded}
                  onClick={(e) => {
                    handleCta(e, selectedItem, closeModal, navigate, {
                      selectedVersion,
                      selectedItem,
                      isDevConsoleProxyAvailable,
                      namespace,
                      callback,
                      setFailedTasks,
                    });
                  }}
                >
                  {getCtaButtonText(selectedItem, selectedVersion)}
                </Button>
              </SplitItem>
            )}
            {versions.length > 0 && (
              <SplitItem data-test="task-version-dropdown">
                <PipelineQuickSearchVersionDropdown
                  key={selectedItem.uid}
                  versions={versions}
                  item={selectedItem}
                  selectedVersion={selectedVersion}
                  onChange={onChangeVersion}
                />
              </SplitItem>
            )}
          </Split>
        </LevelItem>
      </Level>
      {selectedItem.provider !== TaskProviders.redhat && (
        <PipelineQuickSearchTaskAlert
          ctaType={getTaskCtaType(selectedItem, selectedVersion)}
        />
      )}
      <Content
        className="opp-quick-search-details__description"
        data-test="task-description"
      >
        {selectedItem.description}
      </Content>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('Categories')}
              data-test="task-category-list"
            >
              {selectedItem?.attributes?.categories.map((category) => (
                <Label
                  color="blue"
                  key={category}
                  data-test="task-category-list-item"
                >
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={kind === TaskModel.kind ? t('tags') : null}
              data-test="task-tag-list"
            >
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag} data-test="task-tag-list-item">
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {kind === PipelineModel.kind &&
          selectedItem?.data?.metadata?.labels &&
          Object.keys(selectedItem?.data?.metadata?.labels).length > 0 && (
            <StackItem>
              <LabelGroup
                categoryName={t('Labels')}
                data-test="pipeline-annotation-list"
              >
                {Object.keys(selectedItem?.data?.metadata?.labels).map(
                  (labelKey) => (
                    <Label
                      color="grey"
                      key={labelKey}
                      data-test="annotations-list-item"
                    >
                      {labelKey}=
                      {selectedItem?.data?.metadata?.labels[labelKey]}
                    </Label>
                  ),
                )}
              </LabelGroup>
            </StackItem>
          )}
        {kind === PipelineModel.kind &&
          selectedItem?.data?.metadata?.annotations &&
          Object.keys(selectedItem?.data?.metadata?.annotations).length > 0 && (
            <StackItem>
              <LabelGroup
                categoryName={t('Annotations')}
                data-test="pipeline-annotation-list"
              >
                {Object.keys(selectedItem?.data?.metadata?.annotations).map(
                  (annotationKey) =>
                    !QUICK_SEARCH_DETAILS_EXCLUDED_ANNOTATIONS.includes(
                      annotationKey,
                    ) && (
                      <Label
                        color="grey"
                        key={annotationKey}
                        data-test="annotations-list-item"
                      >
                        {annotationKey}=
                        {
                          selectedItem?.data?.metadata?.annotations[
                            annotationKey
                          ]
                        }
                      </Label>
                    ),
                )}
              </LabelGroup>
            </StackItem>
          )}
      </Stack>
    </div>
  );
};

export default PipelineQuickSearchDetails;
