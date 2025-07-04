import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';

export const connectedPipelineOne = {
  pipeline: pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline,
  pipelineRuns: [
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[
      DataState.SUCCESS
    ],
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[
      DataState.IN_PROGRESS
    ],
  ],
};
