import * as React from 'react';
import { useFormikContext } from 'formik';
import { SelectedBuilderTask, TektonParam } from '../../../types';
import { PipelineBuilderFormikValues } from '../types';
import TextColumnField from '../../text-column-field/TextColumnField';
import { MergeNewValueUtil } from '../../text-column-field/text-column-types';
import AutoCompletePopover from '../../auto-complete/AutoCompletePopover';
import { useBuilderParams } from '../../auto-complete/autoCompleteValueParsers';
import { paramIsRequired } from '../../start-pipeline/validation-utils';
import TextAreaField from '../../common/TextAreaField';

import './TaskSidebarParam.scss';

type TaskSidebarParamProps = {
  hasParam: boolean;
  name: string;
  resourceParam: TektonParam;
  selectedData?: SelectedBuilderTask;
};

const TaskSidebarParam: React.FC<TaskSidebarParamProps> = (props) => {
  const { setFieldValue } = useFormikContext<PipelineBuilderFormikValues>();
  const { hasParam, name, resourceParam, selectedData } = props;
  const autoCompleteOptions = useBuilderParams(selectedData);

  const emptyIsInvalid = paramIsRequired(resourceParam);

  const resourceParamName = resourceParam.name;
  const fieldName = `${name}.value`;

  const setValue = React.useCallback(
    (value: string) => {
      if (hasParam) {
        setFieldValue(fieldName, value);
      } else {
        setFieldValue(name, { name: resourceParamName, value });
      }
    },
    [hasParam, fieldName, name, setFieldValue, resourceParamName],
  );

  const textAreaSettings: Omit<
    React.ComponentProps<typeof TextAreaField>,
    'name'
  > = {
    rows: 1,
    resizeOrientation: 'vertical',
  };

  return (
    <div
      className="opp-task-sidebar-param"
      data-test={`parameter ${resourceParamName}`}
    >
      {resourceParam.type === 'array' ? (
        <TextColumnField
          name={fieldName}
          label={resourceParam.name}
          required={emptyIsInvalid}
        >
          {(
            { name: arrayName, ...additionalProps },
            mergeNewValue: MergeNewValueUtil,
          ) => (
            <AutoCompletePopover
              autoCompleteValues={autoCompleteOptions}
              onAutoComplete={(newValue: string) => {
                const newValues = mergeNewValue(newValue);
                setFieldValue(name, {
                  name: resourceParamName,
                  value: newValues,
                });
              }}
            >
              {(ref) => (
                <TextAreaField
                  ref={ref}
                  data-test={`value ${arrayName}`}
                  aria-label={resourceParam.name}
                  name={arrayName}
                  {...additionalProps}
                  {...textAreaSettings}
                  onChange={(newValue: string) => {
                    const values: string[] = mergeNewValue(newValue);
                    if (!hasParam) {
                      setFieldValue(name, {
                        name: resourceParamName,
                        value: values,
                      });
                    }
                  }}
                />
              )}
            </AutoCompletePopover>
          )}
        </TextColumnField>
      ) : (
        <AutoCompletePopover
          autoCompleteValues={autoCompleteOptions}
          onAutoComplete={setValue}
        >
          {(ref) => (
            <TextAreaField
              ref={ref}
              data-test={`value ${fieldName}`}
              name={fieldName}
              label={resourceParam.name}
              placeholder={resourceParam.default as string}
              helpText={resourceParam.description}
              required={emptyIsInvalid}
              onChange={(value: string) => {
                if (!hasParam) {
                  setValue(value);
                }
              }}
              {...textAreaSettings}
            />
          )}
        </AutoCompletePopover>
      )}
    </div>
  );
};

export default TaskSidebarParam;
