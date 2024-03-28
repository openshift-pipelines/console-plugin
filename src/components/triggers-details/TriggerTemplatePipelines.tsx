import * as React from 'react';
import { TriggerTemplateKind } from '../../types';
import { getTriggerTemplatePipelineName } from '../utils/triggers';
import DynamicResourceLinkList from './DynamicResourceLinkList';
import { PipelineModel } from '../../models';

type TriggerTemplatePipelinesProps = {
  obj: TriggerTemplateKind;
};

const TriggerTemplatePipelines: React.FC<TriggerTemplatePipelinesProps> = ({
  obj,
}) => {
  const namespace = obj?.metadata.namespace;
  const pipelineName: string = getTriggerTemplatePipelineName(obj);
  return (
    <DynamicResourceLinkList
      links={[pipelineName].map((name) => ({
        resourceKind: PipelineModel.kind,
        name,
      }))}
      namespace={namespace}
    />
  );
};

export default TriggerTemplatePipelines;
