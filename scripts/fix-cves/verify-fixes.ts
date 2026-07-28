#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * Reinstall from yarn.lock and verify each remediated package via analyze-deps.
 */

import * as path from 'path';
import type { AnalysisResult, FixRunResults } from './types';
import {
  ensureDir,
  getArg,
  readJson,
  reinstallWithoutLockRefresh,
  runCmd,
  runCmdOrThrow,
  sanitizePackageFilename,
  writeFile,
} from './utils';


const ANALYZE_SCRIPT = path.join(__dirname, 'analyze-deps.ts');

function reanalyze(pkg: string, fixedVersions: string[]): AnalysisResult {
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
  const match = raw.match(/\{\s*"package"/);
  const jsonStart = match?.index ?? -1;
  if (jsonStart < 0) {
    throw new Error(`analyze-deps produced no JSON for ${pkg}:\n${raw}`);
  }
  return JSON.parse(raw.slice(jsonStart)) as AnalysisResult;
}

function main(): void {
  const artifactsDir = getArg('--artifacts-dir') ?? 'cve-artifacts';
  const resultsPath =
    getArg('--results') ?? path.join(artifactsDir, 'results.json');
  const skipReinstall = process.argv.includes('--skip-reinstall');

  const results = readJson<FixRunResults>(resultsPath);

  if (!skipReinstall) {
    reinstallWithoutLockRefresh();
  }

  ensureDir(path.join(artifactsDir, 'verification'));
  let verificationFailed = false;

  for (const pkgResult of results.packages) {
    if (pkgResult.strategy === 'triage-needed') {
      pkgResult.verified = false;
      pkgResult.verificationDetail =
        'Skipped verification — package requires triage';
      verificationFailed = true;
      continue;
    }

    const safeName = sanitizePackageFilename(pkgResult.package);
    console.log(`\n=== Verifying ${pkgResult.package} ===`);

    const npmLs = runCmd('npm', ['ls', '--all', pkgResult.package]).trimEnd();
    const yarnWhy = runCmd('yarn', ['why', pkgResult.package]).trimEnd();
    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-npm-ls.txt`),
      npmLs + '\n',
    );
    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-yarn-why.txt`),
      yarnWhy + '\n',
    );

    pkgResult.verifyNpmLs = npmLs;
    pkgResult.verifyYarnWhy = yarnWhy;

    const analysis = reanalyze(pkgResult.package, pkgResult.fixedVersions);
    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-analysis.json`),
      JSON.stringify(analysis, null, 2) + '\n',
    );

    const ok = analysis.strategy === 'already-remediated';
    pkgResult.verified = ok;
    pkgResult.verificationDetail = ok
      ? `Verified: all installed copies satisfy fixed versions (${analysis.reason})`
      : `Verification failed: strategy=${analysis.strategy} — ${analysis.reason}`;

    console.log(pkgResult.verificationDetail);
    if (!ok) {
      verificationFailed = true;
    }
  }

  results.verificationFailed = verificationFailed;
  writeFile(resultsPath, JSON.stringify(results, null, 2) + '\n');

  if (verificationFailed) {
    console.error('\nVerification failed for one or more packages.');
    process.exit(1);
  }

  console.log('\nAll packages verified successfully.');
}

main();
