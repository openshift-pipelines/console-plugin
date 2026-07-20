import { useEffect, useMemo, useState } from 'react';
import { ChildReferences, ComputedStatus, PipelineRunKind } from '../../types';
import { getChildPipelineRunReferences } from '../utils/pipeline-utils';
import { usePipelineRuns } from './useTaskRuns';
import { pipelineRunStatus } from '../utils/pipeline-filter-reducer';

const TERMINAL = new Set([
  ComputedStatus.Succeeded,
  ComputedStatus.Failed,
  ComputedStatus.Cancelled,
]);

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
  const [queue, setQueue] = useState(() => childRefs.map((r) => r.name));
  const isTerminal = (plr: PipelineRunKind) =>
    plr?.status?.completionTime || TERMINAL.has(pipelineRunStatus(plr));

  const watchName =
    queue.find((name) => !resolved.some((p) => p.metadata.name === name)) ??
    queue.find((name) => {
      const plr = resolved.find((p) => p.metadata.name === name);
      return plr && !isTerminal(plr);
    });

  const [result, loaded] = usePipelineRuns(
    ns,
    watchName ? { name: watchName, limit: 1 } : { skipFetch: true },
  );
  /* if childRefs have changed then reset state params accordingly */
  useEffect(() => {
    setResolved([]);
    setQueue(childRefs.map((r) => r.name));
  }, [childRefs]);

  useEffect(() => {
    const plr = result?.[0];
    if (!watchName || !loaded || plr?.metadata?.name !== watchName) return;

    setResolved((prev) => {
      const idx = prev.findIndex((p) => p.metadata.name === watchName);
      if (idx >= 0) {
        /* Replace the existing PipelineRun with the latest version while preserving array order */
        const next = [...prev];
        next[idx] = plr;
        return next;
      }
      return [...prev, plr];
    });

    // depth === 'inf' only: enqueue grandchildren once this PLR is terminal
    /*  if (depth === 'inf' && isTerminal(plr)) {
      const grandchildNames = getChildPipelineRunReferences(plr).map(
        (r) => r.name,
      );
      setQueue((prev) => [...new Set([...prev, ...grandchildNames])]);
    } */
  }, [watchName, loaded, result, depth]);

  const allFetched =
    queue.length === 0 ||
    queue.every((name) => resolved.some((p) => p.metadata.name === name));

  return [resolved, allFetched];
};
