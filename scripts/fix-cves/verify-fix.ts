#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * Reinstall from yarn.lock and verify each remediated package via analyze-deps.
 */

import * as path from 'path';
import type { FixRunResults } from './types';
import { analyzePackage } from './analyze';
import {
  ensureDir,
  getArg,
  readJson,
  reinstallWithoutLockRefresh,
  writeFile,
} from './utils';

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

    // Shared analyzePackage from analyze.ts (eliminates duplication with apply-fix).
    // analyze-deps runs npm ls + yarn why internally and surfaces them in
    // analysis.npmLsRaw / analysis.yarnWhyRaw — no need for separate subprocess calls.
    const analysis = analyzePackage(pkgResult.package, pkgResult.fixedVersions);

    // Use evidence returned by analyze-deps — already the same data, no extra calls
    const npmLs = analysis.npmLsRaw;
    const yarnWhy = analysis.yarnWhyRaw;

    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-npm-ls.txt`),
      npmLs + '\n',
    );
    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-yarn-why.txt`),
      yarnWhy + '\n',
    );
    writeFile(
      path.join(artifactsDir, 'verification', `${safeName}-analysis.json`),
      JSON.stringify(analysis, null, 2) + '\n',
    );

    pkgResult.verifyNpmLs = npmLs;
    pkgResult.verifyYarnWhy = yarnWhy;

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

// Inline — sanitizePackageFilename may not be re-exported from utils in all
// versions; import it there if available, or define locally as a fallback.
function sanitizePackageFilename(pkg: string): string {
  return pkg.replace(/[^a-z0-9._-]/gi, '_');
}

main();
