import * as React from 'react';
import {
  FormGroup,
  Alert,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { useFormikValidationFix } from '../../pipelines-details/multi-column-field/formik-validation-fix';
import { t } from '../../utils/common-utils';
import { RadioInput } from '../../common/RadioInput';
import _ from 'lodash';
import { ExpandCollapse } from '../../common/expand-collapse';
import { RequestSizeInput } from '../../common/request-size-input';
import { StorageClassDropdown } from '../../common/StorageClassDropdown';
import './VolumeClaimTemplateForm.scss';

type AccessMode = 'ReadWriteOnce' | 'ReadWriteMany' | 'ReadOnlyMany';
export const initialAccessModes: AccessMode[] = [
  'ReadWriteOnce',
  'ReadWriteMany',
  'ReadOnlyMany',
];

export const getAccessModeRadios = () => [
  {
    value: 'ReadWriteOnce',
    title: t('Single user (RWO)'),
  },
  {
    value: 'ReadWriteMany',
    title: t('Shared access (RWX)'),
  },
  {
    value: 'ReadOnlyMany',
    title: t('Read only (ROX)'),
  },
];

export const getVolumeModeRadios = () => [
  {
    value: 'Filesystem',
    title: t('Filesystem'),
  },
  {
    value: 'Block',
    title: t('Block'),
  },
];

export const dropdownUnits = {
  i: 'B',
  Ki: 'KiB',
  Mi: 'MiB',
  Gi: 'GiB',
  Ti: 'TiB',
  Pi: 'PiB',
  Ei: 'EiB',
};

type VolumeMode = 'Filesystem' | 'Block';

type PartialMatch = { partialMatch?: boolean };

type ModeMapping = {
  [volumeMode in VolumeMode]?: AccessMode[];
};
type AccessModeMapping = ModeMapping & PartialMatch;

type ProvisionerAccessModeMapping = {
  [provisioner: string]: AccessModeMapping;
};

// See https://kubernetes.io/docs/concepts/storage/persistent-volumes/#types-of-persistent-volumes for more details
export const provisionerAccessModeMapping: ProvisionerAccessModeMapping =
  Object.freeze({
    'kubernetes.io/no-provisioner': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'kubernetes.io/aws-ebs': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'kubernetes.io/gce-pd': {
      Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadOnlyMany'],
    },
    'kubernetes.io/glusterfs': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    },
    'kubernetes.io/cinder': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'kubernetes.io/azure-file': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    },
    'kubernetes.io/azure-disk': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'kubernetes.io/quobyte': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    },
    'kubernetes.io/rbd': {
      Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadOnlyMany'],
    },
    'kubernetes.io/vsphere-volume': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany'],
    },
    'kubernetes.io/portworx-volume': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany'],
    },
    'kubernetes.io/scaleio': {
      Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadOnlyMany'],
    },
    'kubernetes.io/storageos': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    // Since 4.6 new provisioners names will be without the 'kubernetes.io/' prefix.
    'manila.csi.openstack.org': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    },
    'ebs.csi.aws.com': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'block.csi.ibm.com': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'csi.ovirt.org': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'cinder.csi.openstack.org': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'pd.csi.storage.gke.io': {
      Filesystem: ['ReadWriteOnce'],
      Block: ['ReadWriteOnce'],
    },
    'cephfs.csi.ceph.com': {
      Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      partialMatch: true,
    },
    'rbd.csi.ceph.com': {
      Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
      Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
      partialMatch: true,
    },
  });

export const cephStorageProvisioners = [
  'ceph.rook.io/block',
  'cephfs.csi.ceph.com',
  'rbd.csi.ceph.com',
];

export const getProvisionerModeMapping = (provisioner: string): ModeMapping =>
  _.omit(
    _.find(
      provisionerAccessModeMapping,
      (value: AccessModeMapping, key: string) => {
        if (value?.partialMatch && provisioner?.includes(key)) {
          return true;
        }
        if (key === provisioner) {
          return true;
        }
        return false;
      },
    ) || {},
    'partialMatch',
  );

export const getAccessModeForProvisioner = (
  provisioner: string,
  ignoreReadOnly?: boolean,
  volumeMode?: string,
): AccessMode[] => {
  let accessModes: AccessMode[];
  const modeMapping: ModeMapping = getProvisionerModeMapping(provisioner);

  if (!_.isEmpty(modeMapping)) {
    accessModes = volumeMode
      ? modeMapping[volumeMode]
      : Object.keys(modeMapping)
          .map((mode) => modeMapping[mode])
          .flat();
  } else {
    accessModes = initialAccessModes;
  }

  // remove duplicate in accessModes
  accessModes = [...new Set(accessModes)];

  // Ignore ReadOnly related access for create-pvc
  return ignoreReadOnly
    ? accessModes.filter((modes) => modes !== 'ReadOnlyMany')
    : accessModes;
};

interface VolumeClaimTemplateFormProps {
  name: string;
  initialSizeValue?: string;
  initialSizeUnit?: string;
  initialVolumeMode?: string;
}

interface RequestSize {
  value: string;
  unit: string;
}

const VolumeClaimTemplateForm: React.FC<VolumeClaimTemplateFormProps> = ({
  name,
  initialSizeValue = '1',
  initialSizeUnit = 'Gi',
  initialVolumeMode = 'Filesystem',
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [field] = useField(name);
  const initAccessModeHelp = t('Permissions to the mounted drive.');
  const [accessModeHelp, setAccessModeHelp] =
    React.useState(initAccessModeHelp);
  const { setFieldValue, setFieldTouched, errors } =
    useFormikContext<FormikValues>();
  const [allowedAccessModes, setAllowedAccessModes] =
    React.useState<string[]>(initialAccessModes);
  const [volumeMode, setVolumeMode] = React.useState(initialVolumeMode);
  const [accessMode, setAccessMode] = React.useState('ReadWriteOnce');
  const [requestSizeError, setRequestSizeError] = React.useState(null);
  const [requestSizeValue, setRequestSizeValue] =
    React.useState(initialSizeValue);
  const [requestSizeUnit, setRequestSizeUnit] = React.useState(initialSizeUnit);
  const [storageProvisioner, setStorageProvisioner] = React.useState('');
  const [storageClass, setStorageClass] = React.useState('');
  useFormikValidationFix(field.value);

  const handleAccessMode: React.ReactEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setAccessMode(event.currentTarget.value);
  };

  const handleVolumeMode: React.ReactEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setVolumeMode(event.currentTarget.value);
  };

  const handleStorageClass = (updatedStorageClass): void => {
    const provisioner: string = updatedStorageClass?.provisioner || '';
    // if the provisioner is unknown or no storage class selected, user should be able to set any access mode
    const modes = getAccessModeForProvisioner(provisioner);
    // setting message to display for various modes when a storage class of a know provisioner is selected
    const displayMessage = modes
      ? t('Access mode is set by storage class and cannot be changed')
      : t('Permissions to the mounted drive');
    setAccessMode('ReadWriteOnce');
    setAccessModeHelp(displayMessage);
    // setting accessMode to default with the change to Storage Class selection
    setAllowedAccessModes(modes);
    setStorageClass(updatedStorageClass?.metadata?.name);
    setStorageProvisioner(provisioner);
    if (storageProvisioner.includes(cephStorageProvisioners[1])) {
      setVolumeMode('Filesystem');
    }
  };

  const handleRequestSizeChange = (size: RequestSize): void => {
    const { value, unit } = size;
    setRequestSizeValue(value);
    setRequestSizeUnit(unit);
  };

  React.useEffect(() => {
    setRequestSizeError(null);
    const volumeClaimTemplate = {
      spec: {
        accessModes: [accessMode],
        storageClassName: storageClass,
        volumeMode,
        resources: {
          requests: { storage: `${requestSizeValue}${requestSizeUnit}` },
        },
      },
    };
    if (!requestSizeValue || parseInt(requestSizeValue, 10) < 1) {
      volumeClaimTemplate.spec.resources.requests.storage = null;
      setRequestSizeError(t('Size must be an integer greater than 0.'));
    }

    setFieldValue(name, volumeClaimTemplate);
    setFieldTouched(name);
  }, [
    volumeMode,
    accessMode,
    requestSizeValue,
    requestSizeUnit,
    storageClass,
    name,
    setFieldTouched,
    setFieldValue,
    t,
  ]);

  const helpText = !requestSizeError
    ? t(
        'This will create a PersistentVolumeClaim with a size of {{requestSizeValue}} {{requestSizeUnit}}.',
        { requestSizeValue, requestSizeUnit },
      )
    : t('This will create a PersistentVolumeClaim.');

  return (
    <FormGroup fieldId={name}>
      {errors[name] && (
        <Alert isInline variant="danger" title={t('Required')} />
      )}
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{helpText}</HelperTextItem>
        </HelperText>
      </FormHelperText>
      <ExpandCollapse
        textExpanded={t('Hide VolumeClaimTemplate options')}
        textCollapsed={t('Show VolumeClaimTemplate options')}
      >
        <StorageClassDropdown
          onChange={handleStorageClass}
          id="storageclass-dropdown"
          data-test="storageclass-dropdown"
          describedBy="storageclass-dropdown-help"
          required={false}
          name="storageClass"
        />
        <FormGroup
          label={t('Access Mode')}
          isRequired
          fieldId="accessMode"
          data-test-id="accessModeRadio"
          role="radiogroup"
          className="pf-v6-u-mt-md"
        >
          <div className="pf-v6-l-flex pf-m-row-gap-x-md pf-v6-l-flex-wrap">
            {getAccessModeRadios().map((radio) => {
              const disabled = !allowedAccessModes.includes(radio.value);
              return (
                <RadioInput
                  {...radio}
                  key={radio.value}
                  onChange={handleAccessMode}
                  disabled={disabled}
                  checked={radio.value === accessMode}
                  aria-describedby="access-mode-help"
                  name={`${name}.accessMode`}
                />
              );
            })}
          </div>
          <FormHelperText>
            <HelperText>
              <HelperTextItem id="access-mode-help">
                {accessModeHelp}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup
          label={t('Size')}
          isRequired
          fieldId="request-size-input"
          className="pf-v6-u-mt-md"
        >
          <RequestSizeInput
            name="requestSize"
            required
            onChange={handleRequestSizeChange}
            defaultRequestSizeUnit={requestSizeUnit}
            defaultRequestSizeValue={requestSizeValue}
            dropdownUnits={dropdownUnits}
            describedBy="request-size-help"
            inputID="request-size-input"
            data-test-id="pvc-size-input"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem
                id="request-size-help"
                variant={requestSizeError ? 'error' : 'default'}
              >
                {requestSizeError || t('Desired storage capacity')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup
          label={t('Volume Mode')}
          fieldId="volumeMode"
          data-test-id="volumeModeRadio"
          role="radiogroup"
          className="pf-v6-u-mt-md"
        >
          <div className="pf-v6-l-flex pf-m-row-gap-x-md pf-v6-l-flex-wrap">
            {getVolumeModeRadios().map((radio) => (
              <RadioInput
                {...radio}
                key={radio.value}
                onChange={handleVolumeMode}
                checked={radio.value === volumeMode}
                name={`${name}.volumeMode`}
              />
            ))}
          </div>
        </FormGroup>
      </ExpandCollapse>
    </FormGroup>
  );
};

export default VolumeClaimTemplateForm;
