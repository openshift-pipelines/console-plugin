import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { omit } from 'lodash';
import { ARTIFACTHUB, CTALabel } from '../const';
import {
  findInstalledTask,
  getSelectedVersionUrl,
  getTaskCtaType,
  isExternalTask,
  isInstalledNamespaceTask,
  isOneVersionInstalled,
  isSelectedVersionInstalled,
  isSelectedVersionUpgradable,
  isTaskSearchable,
  isTaskVersionInstalled,
  TektonTaskAnnotation,
} from '../pipeline-quicksearch-utils';
import {
  sampleCatalogItems,
  sampleCommunityCatalogItem,
  sampleTaskCatalogItem,
} from './catalog-item-data';

describe('pipeline-quicksearch-utils', () => {
  const sampleCatalogInstalledTask: CatalogItem = {
    ...sampleTaskCatalogItem,
    data: {
      ...sampleTaskCatalogItem.data,
      metadata: {
        ...sampleTaskCatalogItem.data.metadata,
        annotations: {
          ...sampleTaskCatalogItem.data.metadata.annotations,
          [TektonTaskAnnotation.installedFrom]: ARTIFACTHUB,
        },
      },
    },
  };

  describe('isSelectedVersionInstalled', () => {
    it('should return false when the attributes is not present in catalogItem', () => {
      expect(
        isSelectedVersionInstalled(
          omit(sampleCommunityCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBe(false);
    });

    it('should return false when the selected version is not installed', () => {
      expect(
        isSelectedVersionInstalled(sampleCommunityCatalogItem, '0.1'),
      ).toBe(false);
    });

    it('should return true when the selected version is installed', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isSelectedVersionInstalled(catalogItem, '0.1')).toBe(true);
    });
  });

  describe('isTaskVersionInstalled', () => {
    it('should return false when the attributes is not present in catalogItem', () => {
      expect(
        isTaskVersionInstalled(
          omit(sampleCommunityCatalogItem, 'attributes') as CatalogItem,
        ),
      ).toBe(false);
    });
    it('should return false when the installed attribute is not present in catalogItem', () => {
      expect(isTaskVersionInstalled(sampleCommunityCatalogItem)).toBe(false);
    });
    it('should return true when the installed attribute is set in catalogItem', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isTaskVersionInstalled(catalogItem)).toBe(true);
    });
  });

  describe('isOneVersionInstalled', () => {
    it('should return false when the attributes is not present in catalogItem', () => {
      expect(
        isOneVersionInstalled(
          omit(sampleCommunityCatalogItem, 'attributes') as CatalogItem,
        ),
      ).toBe(false);
    });

    it('should return false when the none of the version is installed in the cluster', () => {
      expect(isOneVersionInstalled(sampleCommunityCatalogItem)).toBe(false);
    });

    it('should return true when the one version is installed in the cluster', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isOneVersionInstalled(catalogItem)).toBe(true);
    });
  });

  describe('isSelectedVersionUpgradable', () => {
    it('should return false when the attributes is not present in catalogItem', () => {
      expect(
        isSelectedVersionUpgradable(
          omit(sampleCommunityCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBe(false);
    });

    it('should return false when the passed version is not upgradable', () => {
      expect(
        isSelectedVersionUpgradable(sampleCommunityCatalogItem, '0.1'),
      ).toBe(false);
    });

    it('should return false when the selected version is already installed in the cluster', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isSelectedVersionUpgradable(catalogItem, '0.1')).toBe(false);
    });

    it('should return true when the selected version is upgradable in catalogItem', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isSelectedVersionUpgradable(catalogItem, '2')).toBe(true);
    });
  });

  describe('getTaskCtaType', () => {
    it('should return the Install button type for the uninstalled task', () => {
      expect(getTaskCtaType(sampleCommunityCatalogItem, '0.1')).toBe(
        CTALabel.Install,
      );
    });

    it('should return the Add button type for the installed version', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(getTaskCtaType(catalogItem, '0.1')).toBe(CTALabel.Add);
    });

    it('should return the Upgrade button type if selected version is upgradable', () => {
      const catalogItem: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(getTaskCtaType(catalogItem, '2')).toBe(CTALabel.Update);
    });
  });

  describe('isInstalledNamespaceTask', () => {
    it('should return false if the annotations are missing in the metadata', () => {
      expect(
        isInstalledNamespaceTask(
          omit(
            sampleTaskCatalogItem,
            'data.metadata.annotations',
          ) as CatalogItem,
        ),
      ).toBe(false);
    });

    it('should return false if the community task is passed', () => {
      expect(isInstalledNamespaceTask(sampleCommunityCatalogItem)).toBe(false);
    });

    it('should return false if the namespace task is not installed through pipeline builder', () => {
      expect(isInstalledNamespaceTask(sampleTaskCatalogItem)).toBe(false);
    });

    it('should return true if the namespace task is installed through pipeline builder', () => {
      expect(isInstalledNamespaceTask(sampleCatalogInstalledTask)).toBe(true);
    });
  });

  describe('isExternalTask', () => {
    it('should return true for the external task', () => {
      expect(isExternalTask(sampleCommunityCatalogItem)).toBe(true);
    });

    it('should return false if namespaceTask is passed', () => {
      expect(isExternalTask(sampleTaskCatalogItem)).toBe(false);
    });
  });

  describe('isTaskSearchable', () => {
    it('should return true for all the community tasks are searchable', () => {
      expect(
        isTaskSearchable(sampleCatalogItems, sampleCommunityCatalogItem),
      ).toBe(true);
    });

    it('should return true for all the cluster and namespace tasks not added through pipeline builder', () => {
      expect(isTaskSearchable(sampleCatalogItems, sampleTaskCatalogItem)).toBe(
        true,
      );
    });

    it('should return false for all the namespace tasks added through pipeline builder', () => {
      expect(
        isTaskSearchable(sampleCatalogItems, sampleCatalogInstalledTask),
      ).toBe(false);
    });
  });

  describe('getSelectedVersionUrl', () => {
    it('should return null if the attirbutes is not present in the catalogItem', () => {
      expect(
        getSelectedVersionUrl(
          omit(sampleCommunityCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBeNull();
    });

    it('should return the content url when set', () => {
      const itemWithContentUrl: CatalogItem = {
        ...sampleCommunityCatalogItem,
        attributes: {
          ...sampleCommunityCatalogItem.attributes,
          selectedVersionContentUrl: 'https://example.com/task.yaml',
        },
      };
      expect(getSelectedVersionUrl(itemWithContentUrl, '0.1')).toBe(
        'https://example.com/task.yaml',
      );
    });

    it('should return null when content url is not set', () => {
      expect(
        getSelectedVersionUrl(sampleCommunityCatalogItem, '0.1'),
      ).toBeNull();
    });
  });

  describe('findInstalledTask', () => {
    it('should return undefined if the annotations are missing in the metadata', () => {
      expect(
        findInstalledTask(
          sampleCatalogItems,
          omit(
            sampleTaskCatalogItem,
            'data.metadata.annotations',
          ) as CatalogItem,
        ),
      ).toBeUndefined();
    });

    it('should return undefined the catalogItem is not installed through pipeline builder', () => {
      expect(
        findInstalledTask(sampleCatalogItems, sampleCommunityCatalogItem),
      ).toBeUndefined();
    });

    it('should return the installed Task resource through pipeline builder', () => {
      const installedCatalogTask: CatalogItem = {
        ...sampleTaskCatalogItem,
        uid: '23',
        name: sampleCommunityCatalogItem.name,
        data: {
          ...sampleTaskCatalogItem.data,
          kind: 'Task',
          metadata: {
            ...sampleTaskCatalogItem.data.metadata,
            annotations: {
              ...sampleTaskCatalogItem.data.metadata.annotations,
              [TektonTaskAnnotation.installedFrom]: ARTIFACTHUB,
            },
          },
        },
      };

      const newCatalogItems = [
        sampleCommunityCatalogItem,
        sampleTaskCatalogItem,
        installedCatalogTask,
      ];
      expect(
        findInstalledTask(newCatalogItems, sampleCommunityCatalogItem),
      ).toBe(installedCatalogTask);
    });
  });
});
