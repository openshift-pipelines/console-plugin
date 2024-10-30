import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  TextInputTypes,
  ValidatedOptions,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { STATUS_KEY_NAME_ERROR } from '../const';
import { NameErrorStatus, PipelineBuilderFormikValues } from '../types';
import { nameValidationSchema } from '../validation-utils';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

type TaskSidebarNameProps = {
  name: string;
  onChange: (newName: string) => void;
  taskName: string;
};

const TaskSidebarName: React.FC<TaskSidebarNameProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { name, onChange, taskName } = props;
  const { setStatus, status, values } =
    useFormikContext<PipelineBuilderFormikValues>();
  const {
    formData: { tasks, finallyTasks },
  } = values;
  const initialName: string = _.get(values, name, taskName);
  const statusPath: string[] = [STATUS_KEY_NAME_ERROR, name];
  const { nameError, errorMessage }: NameErrorStatus = _.get(
    status,
    statusPath,
    {},
  );
  const [interimName, setInterimName] = React.useState(
    nameError ?? initialName,
  );
  const [validating, setValidating] = React.useState(null);
  const isValid = !errorMessage;
  const reservedNames: string[] = [...tasks, ...finallyTasks]
    .map(({ name: usedName }) => usedName)
    .filter((usedName) => usedName !== initialName);

  const saveErrorState = (value: string, message: string) => {
    setStatus({
      ...status,
      [STATUS_KEY_NAME_ERROR]: {
        ...(status?.[STATUS_KEY_NAME_ERROR] || {}),
        // `name` stored as a path string intentionally
        [name]: {
          nameError: value,
          errorMessage: message,
        },
      },
    });
  };
  const clearErrorState = () => {
    setStatus({
      ...status,
      [STATUS_KEY_NAME_ERROR]: _.omit(status?.[STATUS_KEY_NAME_ERROR], name),
    });
  };

  return (
    <FormGroup fieldId="task-name" label={t('Display name')} isRequired>
      <TextInput
        data-test={`task-name ${interimName}`}
        id="task-name"
        validated={isValid ? ValidatedOptions.default : ValidatedOptions.error}
        isRequired
        onChange={(_event, value) => {
          setInterimName(value);

          if (reservedNames.includes(value)) {
            saveErrorState(value, t('This name is already in use.'));
            return;
          }

          setValidating(true);
          nameValidationSchema(t, 63)
            .validate(value)
            .then(() => {
              clearErrorState();
              setValidating(false);
            })
            .catch((err) => {
              saveErrorState(value, err?.message || t('Required'));
              setValidating(false);
            });
        }}
        onBlur={() => {
          if (!validating && isValid) {
            onChange(interimName);
          }
        }}
        placeholder={taskName}
        type={TextInputTypes.text}
        value={interimName}
      />
      {!isValid && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem
              icon={<ExclamationCircleIcon />}
              variant={ValidatedOptions.error}
            >
              {errorMessage}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default TaskSidebarName;
