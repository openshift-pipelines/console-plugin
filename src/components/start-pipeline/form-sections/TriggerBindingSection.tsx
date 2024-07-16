import * as React from 'react';
import {
  Badge,
  ExpandableSection,
  FormHelperText,
  FormSection,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  AddTriggerFormValues,
  TriggerBindingKind,
  TriggerBindingParam,
} from '../../../types';
import TriggerBindingSelector from './TriggerBindingSelector';
import './TriggerBindingSection.scss';

const TriggerBindingSection: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setFieldValue } = useFormikContext<AddTriggerFormValues>();
  const [bindingVars, setBindingVars] =
    React.useState<TriggerBindingParam[]>(null);

  const paramPrefix = 'tt.params.';

  const updateTriggerBindingVariables = React.useCallback(
    (selectedTriggerBinding: TriggerBindingKind) => {
      setBindingVars(selectedTriggerBinding.spec.params);
      setFieldValue('triggerBinding.resource', selectedTriggerBinding);
    },
    [setFieldValue],
  );

  return (
    <div className="odc-trigger-binding-section">
      <FormSection title={t('Webhook')}>
        <TriggerBindingSelector
          description={t(
            'Select your Git provider type to be associated with the Trigger.',
          )}
          label={t('Git provider type')}
          onChange={updateTriggerBindingVariables}
        />
        {bindingVars && (
          <ExpandableSection
            toggleTextExpanded={t('Hide variables')}
            toggleTextCollapsed={t('Show variables')}
          >
            <div className="odc-trigger-binding-section__variable-container">
              <p className="odc-trigger-binding-section__variable-descriptor">
                {t(
                  'The following variables can be used in the Parameters or when created new Resources.',
                )}
              </p>
              {bindingVars.map(({ name }) => (
                <Badge
                  key={name}
                  className="odc-trigger-binding-section__variable-badge"
                  isRead
                >
                  {name}
                </Badge>
              ))}
            </div>
            <FormHelperText className="odc-trigger-binding-section__variable-help-text">
              {t('Use this format when you reference variables in this form: ')}
              <code className="co-code">{`$(${paramPrefix}parameter)`}</code>
            </FormHelperText>
          </ExpandableSection>
        )}
      </FormSection>
    </div>
  );
};

export default TriggerBindingSection;
