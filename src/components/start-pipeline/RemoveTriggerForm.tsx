import * as React from 'react';
import { Icon, Split, SplitItem } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_chart_global_warning_color_100 as warningColor } from "@patternfly/react-tokens/dist/js/t_chart_global_warning_color_100";
import { Trans, useTranslation } from 'react-i18next';
import { PipelineKind } from '../../types';
import TriggerTemplateSelector from './TriggerTemplateSelector';

type RemoveTriggerFormProps = {
  pipeline: PipelineKind;
};

const RemoveTriggerForm: React.FC<RemoveTriggerFormProps> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { pipeline } = props;
  const pipelineName = pipeline.metadata.name;

  return (
    <Split className="odc-modal-content" hasGutter>
      <SplitItem>
        <Icon size="md">
          <ExclamationTriangleIcon color={warningColor.value} />
        </Icon>
      </SplitItem>
      <SplitItem isFilled>
        <p className="co-break-word">
          <Trans t={t}>
            Select the trigger to remove from pipeline <b>{{ pipelineName }}</b>
            .
          </Trans>
        </p>
        <TriggerTemplateSelector
          name="selectedTrigger"
          placeholder={t('Select TriggerTemplate')}
          pipeline={pipeline}
        />
      </SplitItem>
    </Split>
  );
};

export default RemoveTriggerForm;
