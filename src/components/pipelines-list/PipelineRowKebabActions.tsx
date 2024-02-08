// import * as React from 'react';
// import { PipelineWithLatest } from '../../types';
// import { usePipelineTriggerTemplateNames } from '../utils/triggers';

// type PipelineRowKebabActionsProps = {
//   pipeline: PipelineWithLatest;
// };

// const PipelineRowKebabActions: React.FC<PipelineRowKebabActionsProps> = ({
//   pipeline,
// }) => {
//   const {
//     metadata: { name, namespace },
//   } = pipeline;
//   const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
//   const actions = getPipelineKebabActions(
//     pipeline.latestRun,
//     templateNames.length > 0,
//   );
//   const augmentedMenuActions: KebabAction[] =
//     useMenuActionsWithUserAnnotation(actions);
// };

// export default PipelineRowKebabActions;
