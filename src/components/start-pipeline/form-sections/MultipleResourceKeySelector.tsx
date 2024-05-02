import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import MultipleKeySelector from './MultipleKeySelector';
import {
  K8sKind,
  K8sResourceKind,
  RedExclamationCircleIcon,
  useActiveNamespace,
  useK8sWatchResource,
  WatchK8sResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { getFieldId } from '../../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../../pipelines-details/multi-column-field/formik-validation-fix';
import ResourceDropdown from '../../common/ResourceDropdown';

interface MultipleResourceKeySelectorProps {
  label: string;
  resourceModel: K8sKind;
  required?: boolean;
  resourceNameField: string;
  resourceKeysField: string;
  addString?: string;
}

const MultipleResourceKeySelector: React.FC<
  MultipleResourceKeySelectorProps
> = ({
  label,
  resourceModel,
  required,
  resourceNameField,
  resourceKeysField,
  addString,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [namespace] = useActiveNamespace();
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [field, { touched, error }] = useField(resourceNameField);
  const isValid = !(touched && error);
  const fieldId = getFieldId(resourceNameField, 'res-dropdown');
  const [keys, setKeys] = React.useState({});

  useFormikValidationFix(field.value);

  const resource: WatchK8sResource = React.useMemo(
    () => ({
      kind: resourceModel.kind,
      isList: true,
      namespace,
      optional: true,
    }),
    [namespace, resourceModel.kind],
  );

  const [resources, loaded, loadError] = useK8sWatchResource(resource);

  const autocompleteFilter = (strText, item): boolean =>
    fuzzy(strText, item?.props?.name);

  const generateKeys = (resourceName: string) => {
    const selectedResource: K8sResourceKind = _.find(resources, (res) => {
      return _.get(res, 'metadata.name') === resourceName;
    });
    const keyMap = selectedResource?.data ?? {};
    const itemKeys = Object.keys(keyMap).reduce(
      (acc, key) => ({ ...acc, [key]: key }),
      {},
    );
    setKeys(itemKeys);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      className="odc-multiple-key-selector"
      isRequired={required}
    >
      <ResourceDropdown
        resources={[
          {
            kind: resourceModel.kind,
            loaded,
            loadError,
            data: resources as K8sResourceKind[],
          },
        ]}
        loaded={loaded}
        loadError={loadError}
        dataSelector={['metadata', 'name']}
        selectedKey={field.value}
        placeholder={t('Select a {{label}}', {
          label: t(resourceModel.labelKey),
        })}
        autocompleteFilter={autocompleteFilter}
        dropDownClassName={cx({ 'dropdown--full-width': true })}
        onChange={(value: string) => {
          setFieldValue(resourceKeysField, undefined);
          setFieldValue(resourceNameField, value);
          setFieldTouched(resourceNameField, true);
          generateKeys(value);
        }}
        showBadge
      />
      {field.value && !_.isEmpty(keys) && (
        <MultipleKeySelector
          name={resourceKeysField}
          keys={keys}
          addString={addString}
        />
      )}

      {!isValid && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {error}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default MultipleResourceKeySelector;
