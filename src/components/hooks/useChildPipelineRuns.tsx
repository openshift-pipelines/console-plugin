import { useEffect, useMemo, useState } from 'react';
import { ChildReferences, PipelineRunKind } from '../../types';
import { getChildPipelineRunReferences } from '../utils/pipeline-utils';
import { usePipelineRuns } from './useTaskRuns';

export const useChildPipelineRunReferences = (
  parentPipelineRun: PipelineRunKind,
): ChildReferences[] =>
  useMemo(
    () => getChildPipelineRunReferences(parentPipelineRun),
    [parentPipelineRun?.status?.childReferences],
  );

export const useChildPipelineRuns = (
  ns: string,
  childRefs: ChildReferences[] = [],
  { depth }: { depth: 'inf' | number } = { depth: 1 },
): [PipelineRunKind[], boolean] => {
  const [resolved, setResolved] = useState<PipelineRunKind[]>([]);
  const [queue, setQueue] = useState(childRefs.map((r) => r.name));

  const nextName = queue.find(
    (name) => !resolved.some((p) => p.metadata.name === name),
  );
  const [result, loaded] = usePipelineRuns(
    ns,
    nextName ? { name: nextName, limit: 1 } : { skipFetch: true },
  );
  useEffect(() => {
    if (nextName && loaded && result?.[0]) {
      setResolved((prev) => [...prev, result[0]]);

      if (depth === 'inf') {
        const grandchildNames = getChildPipelineRunReferences(result[0]).map(
          (r) => r.name,
        );
        setQueue((prev) => [...prev, ...grandchildNames]);
      }
    }
  }, [nextName, loaded, result]);

  const allResolved = !nextName;
  return [resolved, allResolved];
};
