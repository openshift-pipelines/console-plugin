import * as path from 'path';
import type { AnalysisResult } from './types';
import { runCmdOrThrow } from './utils';

export const ANALYZE_SCRIPT = path.join(__dirname, 'analyze-deps.ts');

/**
 * Shell out to analyze-deps.ts and return the parsed AnalysisResult.
 * Shared by apply-fix.ts and verify-fix.ts to eliminate duplication.
 */
export function analyzePackage(
  pkg: string,
  fixedVersions: string[],
): AnalysisResult {
  const raw = runCmdOrThrow('yarn', [
    'ts-node',
    '--project',
    'scripts/fix-cves/tsconfig.json',
    ANALYZE_SCRIPT,
    '--package',
    pkg,
    '--fixed-version',
    fixedVersions.join(','),
  ]);

  // analyze-deps prints only JSON to stdout; locate the start of the object
  const jsonStart = raw.search(/\{\s*"package"/);
  if (jsonStart < 0) {
    throw new Error(`analyze-deps produced no JSON for ${pkg}:\n${raw}`);
  }

  return JSON.parse(raw.slice(jsonStart)) as AnalysisResult;
}
