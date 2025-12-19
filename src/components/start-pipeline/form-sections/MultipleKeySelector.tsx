import * as React from 'react';
import {
  TextInputTypes,
  Button,
  FormGroup,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikValidationFix } from '../../pipelines-details/multi-column-field/formik-validation-fix';
import InputField from '../../pipelines-details/multi-column-field/InputField';
import { getFieldId } from '../../pipelines-details/multi-column-field/utils';
import DropdownField from '../../common/DropdownField';
import './MultipleKeySelector.scss';

interface MultipleKeySelectorProps {
  name: string;
  keys: { [key: string]: string };
  addString?: string;
  tooltip?: string;
}

const MultipleKeySelector: React.FC<MultipleKeySelectorProps> = ({
  name,
  keys,
  addString,
  tooltip,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { values } = useFormikContext<FormikValues>();
  const items = _.get(values, name, []);
  useFormikValidationFix(items);
  return (
    <FieldArray
      name={name}
      key="multiple-key-selector"
      render={({ push, remove }) => {
        return (
          <FormGroup
            fieldId={getFieldId(name, 'multiple-key-selector')}
            label={t('Items')}
            className="odc-multiple-key-selector"
          >
            {items.length > 0 &&
              items.map((item, index) => {
                const fieldKey = `${name}.${index}.${item.key}`;
                return (
                  <div
                    className="form-group odc-multiple-key-selector__item "
                    key={fieldKey}
                  >
                    <div className="pf-v6-l-flex pf-v6-u-w-100">
                      <div className="pf-v6-u-flex-1">
                        <DropdownField
                          name={`${name}.${index}.key`}
                          title={t('Select a key')}
                          items={keys}
                          fullWidth
                        />
                      </div>
                      <div className="pf-v6-u-flex-1">
                        <InputField
                          name={`${name}.${index}.path`}
                          type={TextInputTypes.text}
                          placeholder={t('Enter a path')}
                        />
                      </div>
                      <div className="pf-v6-u-flex-shrink-0">
                        <Tooltip content={tooltip || t('Remove')}>
                          <MinusCircleIcon
                            aria-hidden="true"
                            onClick={() => remove(index)}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}
            <Button
              variant="link"
              onClick={() => push({ key: '', path: '' })}
              icon={<PlusCircleIcon />}
              isInline
            >
              {addString || t('Add items')}
            </Button>
          </FormGroup>
        );
      }}
    />
  );
};

export default MultipleKeySelector;
