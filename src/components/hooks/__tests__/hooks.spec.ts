import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import {
  PipelineExampleNames,
  pipelineTestData,
} from '../../../test-data/pipeline-data';
import { testHook } from '../../../test-data/utils/hooks-utils';
import { PipelineRunKind } from '../../../types';
import * as hooks from '../hooks';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
const pipelineRuns: PipelineRunKind[] = Object.values(mockData.pipelineRuns);
const {
  metadata: { name: pipelineName, namespace },
} = mockData.pipeline;

describe('useLatestPipelineRun:', () => {
  beforeEach(() => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      pipelineRuns,
      true,
      null,
    ]);
  });
  it('should return the latest pipeline run from the list', () => {
    testHook(() => {
      const latestPipelineRun = hooks.useLatestPipelineRun(
        pipelineName,
        namespace,
      );
      expect(latestPipelineRun).toEqual(pipelineRuns[1]);
    });
  });
  it('should return null if there are no pipeline runs available', () => {
    testHook(() => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, null]);
      const latestPipelineRun = hooks.useLatestPipelineRun(
        pipelineName,
        namespace,
      );
      expect(latestPipelineRun).toBe(null);
    });
  });
  it('should return null if the pipeline runs are still loading', () => {
    testHook(() => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, null]);
      const latestPipelineRun = hooks.useLatestPipelineRun(
        pipelineName,
        namespace,
      );
      expect(latestPipelineRun).toBe(null);
    });
  });
  it('should return null if the pipeline run call results in error', () => {
    testHook(() => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([
        pipelineRuns,
        true,
        { response: { status: 404 } },
      ]);
      const latestPipelineRun = hooks.useLatestPipelineRun(
        pipelineName,
        namespace,
      );
      expect(latestPipelineRun).toBe(null);
    });
  });
});
