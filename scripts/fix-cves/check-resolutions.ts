#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * check-resolutions.ts
 *
 * Audits the `resolutions` block in package.json and flags entries that are:
 *
 *   1. STALE    — the pinned resolution is older than the currently available
 *                 version on npm, and a newer version exists in the same major
 *                 that might have additional security fixes.
 *
 *   2. ORPHANED — the package referenced by the resolution is no longer
 *                 installed in the tree (the parent that needed the pin was
 *                 upgraded or removed, making the entry dead weight).
 *
 *   3. REDUNDANT — the version that would be installed without the resolution
 *                  is already >= the pinned version, meaning the pin has no
 *                  effect and can be removed.
 *
 * Run this periodically (e.g. on a weekly CI schedule or before each release)
 * to prevent the resolutions block from growing unbounded with dead entries.
 *
 * Usage:
 *   yarn ts-node scripts/fix-cves/check-resolutions.ts
 *     [--artifacts-dir cve-artifacts]   # where to write check-resolutions.json
 *     [--fail-on-stale]                 # exit 1 if any stale/orphaned entries
 *
 * Why this exists:
 *   Yarn resolutions are a blunt instrument: they bypass normal semver
 *   negotiation and can mask breakage from consuming packages. Cleaning them
 *   up when they are no longer needed reduces maintenance burden and ensures
 *   the tree stays as close to "organic" resolution as possible.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import semver from 'semver';
import { ensureDir, getArg, writeFile } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResolutionStatus = 'ok' | 'stale' | 'orphaned' | 'redundant';

interface ResolutionCheckResult {
  descriptor: string; // e.g. "semver@^6.0.0"
  package: string; // e.g. "semver"
  pinnedVersion: string;
  installedVersion: string | null;
  latestSameMajor: string | null;
  status: ResolutionStatus;
  detail: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runCmd(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e: any) {
    return e.stdout ?? '';
  }
}

/**
 * Read the concrete installed version from node_modules/<pkg>/package.json.
 * Returns null if the package is not installed or its version field is not a
 * valid concrete semver (some packages mistakenly publish a range like ^7.5.5).
 */
function getInstalledVersion(pkg: string): string | null {
  const nmPath = path.join(
    process.cwd(),
    'node_modules',
    ...pkg.split('/'),
    'package.json',
  );
  if (!fs.existsSync(nmPath)) return null;
  try {
    const pj = JSON.parse(fs.readFileSync(nmPath, 'utf-8'));
    const v = pj.version ?? null;
    // semver.valid() returns null for ranges — only accept concrete X.Y.Z strings
    return v && semver.valid(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Check whether a package is installed by looking directly at node_modules
 * rather than running `npm ls`, which exits non-zero (ELSPROBLEMS) on peer
 * dep issues and can return empty output even when the package exists.
 */
function isInstalled(pkg: string): boolean {
  const nmPath = path.join(
    process.cwd(),
    'node_modules',
    ...pkg.split('/'),
    'package.json',
  );
  return fs.existsSync(nmPath);
}

/**
 * Coerce a value that may be a concrete version OR a semver range into a
 * concrete version string usable with semver.gte / semver.gt.
 * For a range like "^7.5.5", semver.minVersion returns "7.5.5".
 * Returns null if the value cannot be resolved.
 */
function toConcreteVersion(v: string): string | null {
  if (semver.valid(v)) return v;
  const min = semver.minVersion(v);
  return min ? min.version : null;
}

function getLatestSameMajor(pkg: string, pinnedVersion: string): string | null {
  const out = runCmd('npm', [
    'view',
    pkg,
    'versions',
    '--json',
    '--prefer-online',
  ]);
  try {
    const versions: string[] = JSON.parse(out);
    const major = semver.major(pinnedVersion);
    const sameMajor = versions.filter(
      (v) => semver.valid(v) && semver.major(v) === major,
    );
    return semver.maxSatisfying(sameMajor, `^${major}.0.0`) ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract the package name from a resolution descriptor.
 * Handles scoped and unscoped packages, with or without version ranges:
 *   "semver@^6.0.0"         → "semver"
 *   "@babel/core@^7.0.0"    → "@babel/core"
 *   "semver"                 → "semver"
 */
function parseDescriptor(descriptor: string): string {
  // Strip trailing @<range> (but not the leading @ of scoped packages)
  const scoped = descriptor.startsWith('@');
  const withoutLeading = scoped ? descriptor.slice(1) : descriptor;
  const atIndex = withoutLeading.indexOf('@');
  if (atIndex === -1) return descriptor;
  const name = withoutLeading.slice(0, atIndex);
  return scoped ? `@${name}` : name;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const artifactsDir = getArg('--artifacts-dir') ?? 'cve-artifacts';
  const failOnStale = process.argv.includes('--fail-on-stale');

  const pjPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pjPath)) {
    console.error('package.json not found in current directory');
    process.exit(1);
  }

  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  const resolutions: Record<string, string> = pj.resolutions ?? {};

  if (Object.keys(resolutions).length === 0) {
    console.log(
      'No resolutions block found in package.json — nothing to check.',
    );
    return;
  }

  console.log(`Checking ${Object.keys(resolutions).length} resolution(s)…\n`);

  const checkResults: ResolutionCheckResult[] = [];
  let hasIssues = false;

  for (const [descriptor, pinnedVersion] of Object.entries(resolutions)) {
    const pkg = parseDescriptor(descriptor);
    const installed = isInstalled(pkg);
    const installedVersion = getInstalledVersion(pkg);

    // Resolution values can be ranges (e.g. "^7.5.5") — coerce to a concrete
    // version before calling semver.gte/gt which reject range strings.
    const concretePin = toConcreteVersion(pinnedVersion);
    if (!concretePin) {
      console.warn(
        `⚠ Could not parse pinned version for ${descriptor}: ${pinnedVersion} — skipping`,
      );
      continue;
    }

    let status: ResolutionStatus;
    let detail: string;

    if (!installed) {
      status = 'orphaned';
      detail = `Package is no longer present in the dependency tree — resolution can be removed`;
      hasIssues = true;
    } else if (installedVersion && semver.gte(installedVersion, concretePin)) {
      // Heuristic: installed > pin → likely redundant (pin has no effect).
      // installed === pin → pin is working; check whether a newer patch exists.
      if (semver.gt(installedVersion, concretePin)) {
        status = 'redundant';
        detail =
          `Installed version ${installedVersion} > pinned ${concretePin} — ` +
          `resolution may be redundant (verify by removing and re-running yarn install)`;
        hasIssues = true;
      } else {
        const latest = getLatestSameMajor(pkg, concretePin);
        if (latest && semver.gt(latest, concretePin)) {
          status = 'stale';
          detail =
            `Pinned at ${concretePin} but ${latest} is available in the same major — ` +
            `update the resolution to pick up any additional security fixes`;
          hasIssues = true;
        } else {
          status = 'ok';
          detail = `Resolution is current and effective`;
        }
      }
    } else {
      const latest = getLatestSameMajor(pkg, concretePin);
      if (latest && semver.gt(latest, concretePin)) {
        status = 'stale';
        detail =
          `Pinned at ${concretePin} but ${latest} is available in the same major — ` +
          `update the resolution to pick up any additional security fixes`;
        hasIssues = true;
      } else {
        status = 'ok';
        detail = `Resolution is current and effective`;
      }
    }

    const icon =
      status === 'ok'
        ? '✅'
        : status === 'stale'
        ? '🕒'
        : status === 'orphaned'
        ? '🗑'
        : '♻️';

    console.log(
      `${icon} [${status.toUpperCase()}] ${descriptor} → ${pinnedVersion}`,
    );
    console.log(`     ${detail}\n`);

    checkResults.push({
      descriptor,
      package: pkg,
      pinnedVersion,
      installedVersion: installedVersion ?? null,
      latestSameMajor: null, // populated above per-branch where needed
      status,
      detail,
    });
  }

  ensureDir(artifactsDir);
  writeFile(
    path.join(artifactsDir, 'check-resolutions.json'),
    JSON.stringify(checkResults, null, 2) + '\n',
  );

  const counts = checkResults.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('--- Summary ---');
  console.log(`  OK:        ${counts.ok ?? 0}`);
  console.log(`  Stale:     ${counts.stale ?? 0}`);
  console.log(`  Redundant: ${counts.redundant ?? 0}`);
  console.log(`  Orphaned:  ${counts.orphaned ?? 0}`);

  if (hasIssues && failOnStale) {
    console.error(
      '\nOne or more resolutions are stale, orphaned, or redundant (--fail-on-stale).',
    );
    process.exit(1);
  }
}

main();
