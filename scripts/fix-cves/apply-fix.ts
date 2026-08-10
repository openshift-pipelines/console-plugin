#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * Analyze each vulnerable package via analyze-deps.ts and apply the
 * suggested remediation (direct-upgrade / parent-upgrade / resolution).
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AnalysisResult, FixRunResults, PackageFixResult } from './types';
import { analyzePackage } from './analyze';
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
  stripAnsi,
  writeFile,
} from './utils';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate all fix entries up-front before touching the filesystem or
 * running any subprocesses. Catches malformed input early with clear messages.
 */
function validateFixes(fixes: ReturnType<typeof parseFixesInput>): void {
  for (const fix of fixes) {
    if (typeof fix.package !== 'string' || !fix.package.trim()) {
      console.error(
        `Invalid fix entry — missing or empty "package": ${JSON.stringify(
          fix,
        )}`,
      );
      process.exit(1);
    }
    const versions = getFixedVersions(fix);
    if (!versions.length) {
      console.error(
        `Invalid fix entry — no fixed versions provided: ${JSON.stringify(
          fix,
        )}`,
      );
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Strategy application
// ---------------------------------------------------------------------------

/**
 * Apply yarn resolutions for transitive deps that cannot be fixed via a
 * direct or parent upgrade.
 *
 * After writing resolutions and reinstalling, performs a sanity-check that
 * each pinned version actually landed in the tree. Yarn's deduplication or a
 * conflicting constraint can silently override a resolution entry; catching
 * that here prevents a false "already-remediated" result during verification.
 */
function applyResolutions(
  pkg: string,
  entries: Record<string, string>,
): string {
  const pjPath = path.join(process.cwd(), 'package.json');
  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  pj.resolutions = { ...(pj.resolutions ?? {}), ...entries };
  fs.writeFileSync(pjPath, `${JSON.stringify(pj, null, 2)}\n`, 'utf-8');
  runCmdOrThrow('yarn', ['install', '--no-immutable']);

  // Sanity-check: confirm the target version is present in the installed tree.
  // Use a Set so we only check each target version once (multiple descriptors
  // can map to the same target).
  const targetVersions = new Set(Object.values(entries));
  const lsOut = runCmd('npm', ['ls', '--all', pkg]);
  const warnings: string[] = [];
  for (const targetVersion of targetVersions) {
    if (!lsOut.includes(targetVersion)) {
      warnings.push(
        `⚠ Resolution for ${pkg} → ${targetVersion} may not have taken effect (not found in npm ls output)`,
      );
    }
  }
  if (warnings.length) {
    warnings.forEach((w) => console.warn(w));
  }

  return `Updated resolutions: ${JSON.stringify(entries)}${
    warnings.length ? ` [WARNINGS: ${warnings.join(' | ')}]` : ''
  }`;
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
      return applyResolutions(analysis.package, entries);
    }
    case 'triage-needed':
      return 'Skipped — triage needed (cannot auto-remediate)';
    default:
      throw new Error(
        `Unknown strategy: ${(analysis as AnalysisResult).strategy}`,
      );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const jiraId = getArg('--jira') ?? '';
  const releaseBranch = getArg('--release-branch') ?? '';
  const artifactsDir = getArg('--artifacts-dir') ?? 'cve-artifacts';
  const skipClean = process.argv.includes('--skip-clean');

  // --fail-on-triage: exit 1 if any package requires manual triage.
  // Default is to continue (so report artifacts are always produced) and emit
  // a warning. Pass this flag in strict CI pipelines where a triage-needed
  // result must block the PR.
  const failOnTriage = process.argv.includes('--fail-on-triage');

  const fixes = parseFixesInput(requireArg('--fixes'));

  // Validate all entries before touching disk or running subprocesses
  validateFixes(fixes);

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

    // Capture raw evidence alongside analysis.
    // Note: analyze-deps also runs npm ls / yarn why internally and returns
    // them in analysis.npmLsRaw / analysis.yarnWhyRaw. We capture them here
    // first so we have evidence even if analyzePackage throws.
    const npmLsRaw = runCmd('npm', ['ls', '--all', fix.package]).trimEnd();
    const yarnWhyRaw = stripAnsi(
      runCmd('yarn', ['why', fix.package]),
    ).trimEnd();
    writeFile(
      path.join(artifactsDir, 'npm-ls', `${safeName}.txt`),
      npmLsRaw + '\n',
    );
    writeFile(
      path.join(artifactsDir, 'yarn-why', `${safeName}.txt`),
      yarnWhyRaw + '\n',
    );

    // Shared analyzePackage from analyze.ts (eliminates duplication with verify-fix)
    const analysis = analyzePackage(fix.package, fixedVersions);
    const analysisPath = path.join(
      artifactsDir,
      'analysis',
      `${safeName}.json`,
    );
    writeFile(analysisPath, JSON.stringify(analysis, null, 2) + '\n');

    // Prefer analyze-deps evidence when present (it may be richer)
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
    const msg =
      'One or more packages require triage and cannot be auto-remediated.';
    if (failOnTriage) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(
        `⚠ ${msg} Continuing to produce artifacts. ` +
          `Pass --fail-on-triage to treat this as a hard failure in CI.`,
      );
      // exitCode stays 0 so downstream report/artifact steps still run
    }
  }
}

main();
