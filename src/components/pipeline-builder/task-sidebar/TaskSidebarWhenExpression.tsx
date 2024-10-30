import * as React from 'react';
import {
  Button,
  ButtonType,
  ButtonVariant,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useField } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import MultiColumnField from '../../pipelines-details/multi-column-field/MultiColumnField';
import { SelectedBuilderTask } from '../../../types';
import { useBuilderParams } from '../../auto-complete/autoCompleteValueParsers';
import { RowRendererProps } from '../../pipelines-details/multi-column-field/types';
import WhenExpressionForm from '../WhenExpressionForm';

import './TaskSidebarWhenExpression.scss';

type TaskSidebarWhenExpressionProps = {
  hasParam: boolean;
  name: string;
  selectedData: SelectedBuilderTask;
};

const TaskSidebarWhenExpression: React.FC<TaskSidebarWhenExpressionProps> = (
  props,
) => {
  const { name, selectedData } = props;
  const [field] = useField(name);
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const removeWhenExpressionLabel = t('Remove when expression');
  const autoCompleteValues: string[] = useBuilderParams(selectedData);

  return (
    <div className="opp-task-sidebar-when-expression">
      <h2>{t('When expressions')}</h2>
      <p className="co-help-text opp-task-sidebar__paragraph">
        {field.value?.length > 0 ? (
          <Trans ns="plugin__pipelines-console-plugin">
            Use this format when you reference variables in this form:{' '}
            <code className="co-code">$(</code>
          </Trans>
        ) : (
          t('No when expressions are associated with this task.')
        )}
      </p>
      <MultiColumnField
        data-test="when-expression"
        name={name}
        addLabel={t('Add when expression')}
        headers={[]}
        emptyValues={{ input: '', operator: '', values: [''] }}
        rowRenderer={({ onDelete, fieldName }: RowRendererProps) => (
          <div
            className="opp-task-sidebar-when-expression__section"
            data-test={`row ${fieldName}`}
          >
            <WhenExpressionForm
              autoCompleteValues={autoCompleteValues}
              namePrefix={fieldName}
            />
            <div className="opp-task-sidebar-when-expression__control-button-wrapper">
              <Tooltip content={removeWhenExpressionLabel}>
                <Button
                  onClick={onDelete}
                  data-test="remove-when-expression"
                  className="opp-task-sidebar-when-expression__control-button"
                  aria-label={removeWhenExpressionLabel}
                  variant={ButtonVariant.plain}
                  type={ButtonType.button}
                >
                  <MinusCircleIcon />
                  <span className="opp-task-sidebar-when-expression__control-label">
                    {removeWhenExpressionLabel}
                  </span>
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TaskSidebarWhenExpression;