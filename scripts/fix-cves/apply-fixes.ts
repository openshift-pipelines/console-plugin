#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * Analyze each vulnerable package via analyze-deps.ts and apply the
 * suggested remediation (direct-upgrade / parent-upgrade / resolution).
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AnalysisResult, FixRunResults, PackageFixResult } from './types';
import {
  cleanInstall,
  ensureDir,
  getArg,
  getFixedVersions,
  parseFixesInput,
  parseParentUpgradeTarget,
  requireArg,
  runCmd,
  runCmdOrThrow,
  sanitizePackageFilename,
  writeFile,
} from './utils';

const ANALYZE_SCRIPT = path.join(__dirname, 'analyze-deps.ts');

function analyzePackage(pkg: string, fixedVersions: string[]): AnalysisResult {
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
  // analyze-deps prints only JSON to stdout
  const match = raw.match(/\{\s*"package"/);
  const jsonStart = match?.index ?? -1;
  if (jsonStart < 0) {
    throw new Error(`analyze-deps produced no JSON for ${pkg}:\n${raw}`);
  }
  return JSON.parse(raw.slice(jsonStart)) as AnalysisResult;
}

function applyResolutions(entries: Record<string, string>): string {
  const pjPath = path.join(process.cwd(), 'package.json');
  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  pj.resolutions = { ...(pj.resolutions ?? {}), ...entries };
  fs.writeFileSync(pjPath, `${JSON.stringify(pj, null, 2)}\n`, 'utf-8');
  runCmdOrThrow('yarn', ['install', '--no-immutable']);
  return `Updated resolutions: ${JSON.stringify(entries)}`;
}

function applyDirectUpgrade(pkg: string, version: string): string {
  runCmdOrThrow('yarn', ['up', `${pkg}@${version}`]);
  return `Ran yarn up ${pkg}@${version}`;
}

function applyParentUpgrade(suggestions: string[]): string {
  if (!suggestions.length) {
    throw new Error('parent-upgrade strategy but no parentUpgradeSuggestions');
  }
  const target = parseParentUpgradeTarget(suggestions[0]);
  if (!target) {
    throw new Error(
      `Could not parse parent upgrade suggestion: ${suggestions[0]}`,
    );
  }
  runCmdOrThrow('yarn', ['up', `${target.pkg}@${target.version}`]);
  return `Ran yarn up ${target.pkg}@${target.version} (${suggestions[0]})`;
}

function applyStrategy(analysis: AnalysisResult): string {
  switch (analysis.strategy) {
    case 'already-remediated':
      return 'No changes required (already remediated)';
    case 'direct-upgrade':
      return applyDirectUpgrade(analysis.package, analysis.fixedVersion);
    case 'parent-upgrade':
      return applyParentUpgrade(analysis.parentUpgradeSuggestions);
    case 'resolution': {
      const entries = analysis.resolutionEntries;
      if (Object.keys(entries).length === 0) {
        throw new Error(
          'Resolution strategy selected but no entries generated — needs manual triage',
        );
      }
      return applyResolutions(entries);
    }
    case 'triage-needed':
      return 'Skipped — triage needed (cannot auto-remediate)';
    default:
      throw new Error(
        `Unknown strategy: ${(analysis as AnalysisResult).strategy}`,
      );
  }
}

function main(): void {
  const jiraId = getArg('--jira') ?? '';
  const releaseBranch = getArg('--release-branch') ?? '';
  const artifactsDir = getArg('--artifacts-dir') ?? 'cve-artifacts';
  const skipClean = process.argv.includes('--skip-clean');
  const fixes = parseFixesInput(requireArg('--fixes'));

  ensureDir(artifactsDir);
  ensureDir(path.join(artifactsDir, 'analysis'));
  ensureDir(path.join(artifactsDir, 'npm-ls'));
  ensureDir(path.join(artifactsDir, 'yarn-why'));

  if (!skipClean) {
    cleanInstall();
  }

  const packageResults: PackageFixResult[] = [];
  let triageNeeded = false;

  for (const fix of fixes) {
    const fixedVersions = getFixedVersions(fix);
    const safeName = sanitizePackageFilename(fix.package);
    console.log(
      `\n=== Analyzing ${fix.package} (fixed: ${fixedVersions.join(', ')}) ===`,
    );

    // Capture raw evidence before/alongside analysis (analyze-deps also runs these)
    const npmLsRaw = runCmd('npm', ['ls', '--all', fix.package]).trimEnd();
    const yarnWhyRaw = runCmd('yarn', ['why', fix.package]).trimEnd();
    writeFile(
      path.join(artifactsDir, 'npm-ls', `${safeName}.txt`),
      npmLsRaw + '\n',
    );
    writeFile(
      path.join(artifactsDir, 'yarn-why', `${safeName}.txt`),
      yarnWhyRaw + '\n',
    );

    const analysis = analyzePackage(fix.package, fixedVersions);
    const analysisPath = path.join(
      artifactsDir,
      'analysis',
      `${safeName}.json`,
    );
    writeFile(analysisPath, JSON.stringify(analysis, null, 2) + '\n');

    // Prefer analyze-deps evidence when present
    if (analysis.npmLsRaw) {
      writeFile(
        path.join(artifactsDir, 'npm-ls', `${safeName}.txt`),
        analysis.npmLsRaw + '\n',
      );
    }
    if (analysis.yarnWhyRaw) {
      writeFile(
        path.join(artifactsDir, 'yarn-why', `${safeName}.txt`),
        analysis.yarnWhyRaw + '\n',
      );
    }

    console.log(`Strategy: ${analysis.strategy} — ${analysis.reason}`);
    let appliedAction: string;
    try {
      appliedAction = applyStrategy(analysis);
    } catch (err: any) {
      appliedAction = `ERROR: ${err.message}`;
      triageNeeded = true;
    }
    console.log(appliedAction);

    if (analysis.strategy === 'triage-needed') {
      triageNeeded = true;
    }

    packageResults.push({
      package: fix.package,
      fixedVersions,
      strategy: analysis.strategy,
      fixedVersion: analysis.fixedVersion,
      reason: analysis.reason,
      appliedAction,
      analysisPath,
      verified: null,
      verificationDetail: '',
      yarnWhyRaw: analysis.yarnWhyRaw || yarnWhyRaw,
      npmLsRaw: analysis.npmLsRaw || npmLsRaw,
    });
  }

  const results: FixRunResults = {
    jiraId,
    releaseBranch,
    packages: packageResults,
    triageNeeded,
    verificationFailed: false,
  };

  writeFile(
    path.join(artifactsDir, 'results.json'),
    JSON.stringify(results, null, 2) + '\n',
  );

  console.log(`\nWrote results to ${path.join(artifactsDir, 'results.json')}`);
  if (triageNeeded) {
    console.error(
      'One or more packages require triage and cannot be auto-remediated.',
    );
    // Continue so report/artifacts can still be produced; workflow fails later.
    process.exitCode = 0;
  }
}

main();
