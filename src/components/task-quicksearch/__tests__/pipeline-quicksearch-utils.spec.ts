import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { omit } from 'lodash';
import { CTALabel } from '../const';
import {
  findInstalledTask,
  getInstalledFromAnnotation,
  getSelectedVersionUrl,
  getTaskCtaType,
  isExternalTask,
  isInstalledNamespaceTask,
  isOneVersionInstalled,
  isSelectedVersionInstalled,
  isSelectedVersionUpgradable,
  isTaskSearchable,
  isTaskVersionInstalled,
} from '../pipeline-quicksearch-utils';
import {
  sampleCatalogItems,
  sampleTaskCatalogItem,
  sampleTektonHubCatalogItem,
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
          ...getInstalledFromAnnotation(),
        },
      },
    },
  };

  describe('isSelectedVersionInstalled', () => {
    it('should return false when the attributes is not present in catalogItem', () => {
      expect(
        isSelectedVersionInstalled(
          omit(sampleTektonHubCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBe(false);
    });

    it('should return false when the selected version is not installed', () => {
      expect(
        isSelectedVersionInstalled(sampleTektonHubCatalogItem, '0.1'),
      ).toBe(false);
    });

    it('should return true when the selected version is installed', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
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
          omit(sampleTektonHubCatalogItem, 'attributes') as CatalogItem,
        ),
      ).toBe(false);
    });
    it('should return false when the installed attribute is not present in catalogItem', () => {
      expect(isTaskVersionInstalled(sampleTektonHubCatalogItem)).toBe(false);
    });
    it('should return true when the installed attribute is set in catalogItem', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
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
          omit(sampleTektonHubCatalogItem, 'attributes') as CatalogItem,
        ),
      ).toBe(false);
    });

    it('should return false when the none of the version is installed in the cluster', () => {
      expect(isOneVersionInstalled(sampleTektonHubCatalogItem)).toBe(false);
    });

    it('should return true when the one version is installed in the cluster', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
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
          omit(sampleTektonHubCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBe(false);
    });

    it('should return false when the passed version is not upgradable', () => {
      expect(
        isSelectedVersionUpgradable(sampleTektonHubCatalogItem, '0.1'),
      ).toBe(false);
    });

    it('should return false when the selected version is already installed in the cluster', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isSelectedVersionUpgradable(catalogItem, '0.1')).toBe(false);
    });

    it('should return true when the selected version is upgradable in catalogItem', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(isSelectedVersionUpgradable(catalogItem, '2')).toBe(true);
    });
  });

  describe('getTaskCtaType', () => {
    it('should return the Install button type for the uninstalled task', () => {
      expect(getTaskCtaType(sampleTektonHubCatalogItem, '0.1')).toBe(
        CTALabel.Install,
      );
    });

    it('should return the Add button type for the installed version', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
          installed: '0.1',
        },
      };
      expect(getTaskCtaType(catalogItem, '0.1')).toBe(CTALabel.Add);
    });

    it('should return the Upgrade button type if selected version is upgradable', () => {
      const catalogItem: CatalogItem = {
        ...sampleTektonHubCatalogItem,
        attributes: {
          ...sampleTektonHubCatalogItem.attributes,
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

    it('should return false if the tekton hub task is passed', () => {
      expect(isInstalledNamespaceTask(sampleTektonHubCatalogItem)).toBe(false);
    });

    it('should return false if the namespace task is not installed through pipeline builder', () => {
      expect(isInstalledNamespaceTask(sampleTaskCatalogItem)).toBe(false);
    });

    it('should return true if the namespace task is installed through pipeline builder', () => {
      expect(isInstalledNamespaceTask(sampleCatalogInstalledTask)).toBe(true);
    });
  });

  describe('isExternalTask', () => {
    it('should return true for the tekton hub task', () => {
      expect(isExternalTask(sampleTektonHubCatalogItem)).toBe(true);
    });

    it('should return false if namespaceTask is passed', () => {
      expect(isExternalTask(sampleTaskCatalogItem)).toBe(false);
    });
  });

  describe('isTaskSearchable', () => {
    it('should return true for all the tekton hub tasks are searchable', () => {
      expect(
        isTaskSearchable(sampleCatalogItems, sampleTektonHubCatalogItem),
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
          omit(sampleTektonHubCatalogItem, 'attributes') as CatalogItem,
          '0.1',
        ),
      ).toBeNull();
    });

    it('should return the download url when the item and version id is passed', () => {
      expect(getSelectedVersionUrl(sampleTektonHubCatalogItem, '0.1')).toBe(
        'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
      );

      expect(getSelectedVersionUrl(sampleTektonHubCatalogItem, '0.2')).toBe(
        'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.2/ansible-runner.yaml',
      );
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
        findInstalledTask(sampleCatalogItems, sampleTektonHubCatalogItem),
      ).toBeUndefined();
    });

    it('should return the installed Task resource through pipeline builder', () => {
      const installedCatalogTask: CatalogItem = {
        ...sampleTaskCatalogItem,
        uid: '23',
        name: sampleTektonHubCatalogItem.data.name,
        data: {
          ...sampleTaskCatalogItem.data,
          kind: 'Task',
          metadata: {
            ...sampleTaskCatalogItem.data.metadata,
            annotations: {
              ...sampleTaskCatalogItem.data.metadata.annotations,
              ...getInstalledFromAnnotation(),
            },
          },
        },
      };

      const newCatalogItems = [
        sampleTektonHubCatalogItem,
        sampleTaskCatalogItem,
        installedCatalogTask,
      ];
      expect(
        findInstalledTask(newCatalogItems, sampleTektonHubCatalogItem),
      ).toBe(installedCatalogTask);
    });
  });
});
