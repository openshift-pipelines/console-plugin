#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import semver from 'semver';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalysisResult {
  package: string;
  currentVersion: string | null;
  fixedVersion: string;
  isSharedWithSDK: boolean;
  dependencyChains: string[];
  /** Direct parent packages that pull this dep transitively. */
  directParents: string[];
  /** Whether upgrading a direct parent to its latest resolves the CVE. */
  parentUpgradeAvailable: boolean;
  parentUpgradeSuggestions: string[];
  fixedVersionAvailable: boolean;
  availableVersions: string[];
  strategy:
    | 'already-remediated'
    | 'direct-upgrade'
    | 'parent-upgrade'
    | 'resolution'
    | 'triage-needed';
  reason: string;
  yarnWhyRaw: string;
  npmLsRaw: string;
  /** Per-major-version resolution map, e.g. {"pkg@^2.0.0": "2.5.6", "pkg@^4.0.0": "4.0.6"} */
  resolutionEntries: Record<string, string>;
}

interface CLIArgs {
  package: string;
  fixedVersion: string;
  fixedVersions: string[];
}

// ---------------------------------------------------------------------------
// SDK packages whose transitive deps are "shared with openshift-console"
// ---------------------------------------------------------------------------

const SDK_PACKAGES = [
  '@openshift-console/dynamic-plugin-sdk',
  '@openshift-console/dynamic-plugin-sdk-internal',
  '@openshift-console/dynamic-plugin-sdk-webpack',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runCmd(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      // Yarn colors when FORCE_COLOR is set (common in CI/Cursor); disable it.
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
  } catch (e: any) {
    return e.stdout ?? '';
  }
}

/** Strip ANSI SGR sequences (ESC[...m) from captured CLI output. */
function stripAnsi(text: string): string {
  return text.replace(
    new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g'),
    '',
  );
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  let pkg = '';
  let fixedVersionRaw = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--package' && args[i + 1]) pkg = args[++i];
    else if (args[i] === '--fixed-version' && args[i + 1])
      fixedVersionRaw = args[++i];
  }
  if (!pkg || !fixedVersionRaw) {
    console.error(
      'Usage: analyze-deps.ts --package <name> --fixed-version <ver>[,<ver>,...]',
    );
    process.exit(1);
  }
  if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(pkg)) {
    console.error(`Invalid package name: ${pkg}`);
    process.exit(1);
  }
  const fixedVersions = fixedVersionRaw.split(',').map((v) => v.trim());
  for (const v of fixedVersions) {
    if (!semver.valid(v)) {
      console.error(`Invalid semver version: ${v}`);
      process.exit(1);
    }
  }
  return { package: pkg, fixedVersion: fixedVersions[0], fixedVersions };
}

/**
 * Run `yarn why <pkg>` and return raw output + parsed dependency chains.
 * Output is plain text (no ANSI) so evidence and chain parsing stay clean.
 */
function getYarnWhy(pkg: string): { raw: string; chains: string[] } {
  const raw = stripAnsi(runCmd('yarn', ['why', pkg]));
  const chains: string[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('=') && !trimmed.startsWith('Done')) {
      chains.push(trimmed);
    }
  }
  return { raw, chains };
}

/**
 * Determine if a package is a transitive dependency of any SDK package
 * by inspecting `yarn why` output for SDK package names in the chains.
 */
function isTransitiveSDKDep(chains: string[]): boolean {
  return chains.some((chain) =>
    SDK_PACKAGES.some((sdk) => chain.includes(sdk)),
  );
}

/**
 * Get the currently installed version from node_modules or yarn.lock.
 */
function getCurrentVersion(pkg: string): string | null {
  const nmPath = path.join(
    process.cwd(),
    'node_modules',
    ...pkg.split('/'),
    'package.json',
  );
  if (fs.existsSync(nmPath)) {
    try {
      const pj = JSON.parse(fs.readFileSync(nmPath, 'utf-8'));
      return pj.version ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get ALL installed versions of a package across the entire node_modules tree.
 * Catches nested/duplicate copies that the hoisted-only check would miss.
 */
function getAllInstalledVersions(pkg: string): string[] {
  const output = runCmd('npm', ['ls', '--all', pkg, '--json']);
  const versions = new Set<string>();
  try {
    const tree = JSON.parse(output);
    findVersions(tree, pkg, versions);
  } catch (_err) {
    // npm ls produced invalid JSON (e.g. unmet peer deps warnings) — return empty
  }
  return [...versions];
}

function findVersions(node: any, pkg: string, versions: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  if (node.dependencies) {
    for (const [name, dep] of Object.entries<any>(node.dependencies)) {
      if (name === pkg && dep.version) versions.add(dep.version);
      findVersions(dep, pkg, versions);
    }
  }
}

/**
 * Fetch available versions from the npm registry.
 * Uses --prefer-online to bypass stale local cache — important in CI
 * where a cached older index could mask a newly published fix version.
 */
function getAvailableVersions(pkg: string): string[] {
  const output = runCmd('npm', [
    'view',
    pkg,
    'versions',
    '--json',
    '--prefer-online',
  ]);
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

/**
 * Check if this package is a direct dependency or devDependency
 * (as opposed to only transitive).
 */
function isDirectDep(pkg: string): boolean {
  const pjPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pjPath)) return false;
  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  return !!(pj.dependencies?.[pkg] || pj.devDependencies?.[pkg]);
}

/**
 * Parse `yarn why` output (already fetched) to find direct top-level packages
 * that transitively pull in the target package.
 *
 * Accepts pre-fetched yarnWhyOutput to avoid running `yarn why` a second time.
 */
function getDirectParents(pkg: string, yarnWhyOutput: string): string[] {
  const pjPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pjPath)) return [];
  const pj = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
  const allDirect = new Set([
    ...Object.keys(pj.dependencies ?? {}),
    ...Object.keys(pj.devDependencies ?? {}),
  ]);

  const parents = new Set<string>();
  for (const line of yarnWhyOutput.split('\n')) {
    for (const dep of allDirect) {
      if (line.includes(dep)) parents.add(dep);
    }
  }
  parents.delete(pkg);
  return [...parents];
}

/**
 * For a transitive dep, check whether upgrading any direct parent to its
 * latest version would pull in the fixed version. Returns upgrade suggestions.
 */
function checkParentUpgrades(
  pkg: string,
  fixedVersion: string,
  directParents: string[],
): string[] {
  const suggestions: string[] = [];
  for (const parent of directParents) {
    const latest = runCmd('npm', ['view', parent, 'version']).trim();
    if (!latest) continue;
    const depField = runCmd('npm', [
      'view',
      `${parent}@${latest}`,
      'dependencies',
      '--json',
    ]).trim();
    if (!depField) continue;
    try {
      const deps = JSON.parse(depField);
      const range: string | undefined = deps[pkg];
      if (range && semver.satisfies(fixedVersion, range)) {
        suggestions.push(
          `${parent}@${latest} (pulls ${pkg}@${range}, satisfies ${fixedVersion})`,
        );
      }
    } catch {
      // skip
    }
  }
  return suggestions;
}

/**
 * Compare two semver strings. Returns true if `installed` >= `required`.
 * Falls back to false on any parse error to avoid false negatives.
 */
function isVersionSatisfied(installed: string, required: string): boolean {
  try {
    return semver.gte(installed, required);
  } catch {
    return false;
  }
}

/**
 * Find the fix version that matches the same major as the installed version.
 * Returns undefined if no same-major fix exists — never crosses major boundaries
 * because forcing e.g. 1.x → 2.x can break semver contracts of consuming packages.
 */
function getFixForVersion(
  installed: string,
  fixedVersions: string[],
): string | undefined {
  const major = semver.major(installed);
  return fixedVersions.find((fv) => semver.major(fv) === major);
}

/**
 * Check if an installed version is satisfied by any of the fixed versions
 * (matched by major). If no same-major fix exists, the version is considered
 * vulnerable (needs triage — cross-major forcing breaks semver contracts).
 */
function isVersionSatisfiedMulti(
  installed: string,
  fixedVersions: string[],
): boolean {
  const fix = getFixForVersion(installed, fixedVersions);
  if (!fix) return false;
  return isVersionSatisfied(installed, fix);
}

/**
 * Build resolution entries for all vulnerable installed versions.
 * Groups versions by major and checks ALL copies — not just the first.
 * Generates both scoped ("pkg@^X.0.0") and pinned ("pkg@X.Y.Z") entries
 * to catch both range-based and exact-pinned dependency descriptors.
 * Skips majors with no same-major fix (those become triage-needed).
 */
function buildResolutionEntries(
  pkg: string,
  installedVersions: string[],
  fixedVersions: string[],
): Record<string, string> {
  const entries: Record<string, string> = {};
  const byMajor = new Map<number, string[]>();
  for (const v of installedVersions) {
    const major = semver.major(v);
    if (!byMajor.has(major)) byMajor.set(major, []);
    const bucket = byMajor.get(major);
    if (bucket) bucket.push(v);
  }

  for (const [major, versions] of byMajor) {
    const fix = getFixForVersion(versions[0], fixedVersions);
    if (!fix) continue;

    const vulnerable = versions.filter((v) => !isVersionSatisfied(v, fix));
    if (vulnerable.length === 0) continue;

    entries[`${pkg}@^${major}.0.0`] = fix;
    for (const v of vulnerable) {
      entries[`${pkg}@${v}`] = fix;
    }
  }
  return entries;
}

/**
 * Identify which installed majors have no corresponding fix version.
 * Used to produce an actionable triage-needed reason string.
 */
function getStrandedMajors(
  installedVersions: string[],
  fixedVersions: string[],
): number[] {
  const fixedMajors = new Set(fixedVersions.map((fv) => semver.major(fv)));
  const installedMajors = new Set(
    installedVersions.map((v) => semver.major(v)),
  );
  return [...installedMajors].filter((m) => !fixedMajors.has(m)).sort();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = parseArgs();

  // Single yarn why call; result reused everywhere (getDirectParents no longer
  // shells out again — it accepts the pre-fetched output as a parameter).
  const { raw: yarnWhyRaw, chains } = getYarnWhy(args.package);
  const npmLsRaw = runCmd('npm', ['ls', '--all', args.package]).trimEnd();
  const currentVersion = getCurrentVersion(args.package);

  // Full-tree check: verify ALL installed copies satisfy the fix, not just the
  // hoisted one. Falls back to the hoisted version if npm ls returns nothing.
  let installedVersions = getAllInstalledVersions(args.package);
  if (installedVersions.length === 0 && currentVersion) {
    installedVersions = [currentVersion];
  }

  if (installedVersions.length === 0) {
    const result: AnalysisResult = {
      package: args.package,
      currentVersion,
      fixedVersion: args.fixedVersion,
      isSharedWithSDK: false,
      dependencyChains: chains,
      directParents: [],
      parentUpgradeAvailable: false,
      parentUpgradeSuggestions: [],
      fixedVersionAvailable: true,
      availableVersions: [],
      strategy: 'already-remediated',
      reason: 'Package is not installed in the dependency tree',
      yarnWhyRaw,
      npmLsRaw,
      resolutionEntries: {},
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const allSatisfied = installedVersions.every((v) =>
    isVersionSatisfiedMulti(v, args.fixedVersions),
  );
  if (allSatisfied) {
    const sharedWithSDK = isTransitiveSDKDep(chains);
    const result: AnalysisResult = {
      package: args.package,
      currentVersion,
      fixedVersion: args.fixedVersion,
      isSharedWithSDK: sharedWithSDK,
      dependencyChains: chains,
      directParents: [],
      parentUpgradeAvailable: false,
      parentUpgradeSuggestions: [],
      fixedVersionAvailable: true,
      availableVersions: [],
      strategy: 'already-remediated',
      reason: `All ${installedVersions.length} installed copy/copies satisfy fix versions`,
      yarnWhyRaw,
      npmLsRaw,
      resolutionEntries: {},
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const sharedWithSDK = isTransitiveSDKDep(chains);
  const versions = getAvailableVersions(args.package);
  const allFixedAvailable = args.fixedVersions.every((fv) =>
    versions.includes(fv),
  );
  const direct = isDirectDep(args.package);

  // Reuse yarnWhyRaw — no second subprocess call
  const directParents = direct
    ? []
    : getDirectParents(args.package, yarnWhyRaw);
  const parentSuggestions = direct
    ? []
    : checkParentUpgrades(args.package, args.fixedVersion, directParents);

  let strategy: AnalysisResult['strategy'];
  let reason: string;

  if (!allFixedAvailable) {
    const missing = args.fixedVersions.filter((fv) => !versions.includes(fv));
    strategy = 'triage-needed';
    reason = `Fixed version(s) not published on npm: ${missing.join(', ')}`;
  } else if (direct) {
    strategy = 'direct-upgrade';
    reason = sharedWithSDK
      ? 'Direct dependency also pulled by SDK; upgrade directly, SDK will use the hoisted version'
      : 'Direct dependency — safe to upgrade';
  } else if (parentSuggestions.length > 0) {
    strategy = 'parent-upgrade';
    reason = `Upgrading a direct parent pulls in the fix: ${parentSuggestions.join(
      '; ',
    )}`;
  } else if (sharedWithSDK) {
    strategy = 'resolution';
    reason =
      'Transitive dep of SDK; no parent upgrade resolves it — use resolutions to force the fixed version';
  } else {
    strategy = 'resolution';
    reason =
      'Transitive dependency; no parent upgrade resolves it — use resolutions as last resort';
  }

  const resolutionEntries = buildResolutionEntries(
    args.package,
    installedVersions,
    args.fixedVersions,
  );

  if (
    strategy === 'resolution' &&
    Object.keys(resolutionEntries).length === 0
  ) {
    // Surface which majors are stranded so engineers know exactly what to triage
    const strandedMajors = getStrandedMajors(
      installedVersions,
      args.fixedVersions,
    );
    const fixedMajors = args.fixedVersions.map((fv) => semver.major(fv));
    strategy = 'triage-needed';
    reason =
      `No same-major fix for installed major(s) [${strandedMajors.join(
        ', ',
      )}] — ` +
      `available fixes cover major(s) [${fixedMajors.join(', ')}]; ` +
      `cross-major resolution would break semver contracts — needs manual triage`;
  }

  const result: AnalysisResult = {
    package: args.package,
    currentVersion,
    fixedVersion: args.fixedVersion,
    isSharedWithSDK: sharedWithSDK,
    dependencyChains: chains,
    directParents,
    parentUpgradeAvailable: parentSuggestions.length > 0,
    parentUpgradeSuggestions: parentSuggestions,
    fixedVersionAvailable: allFixedAvailable,
    availableVersions: versions.slice(-20),
    strategy,
    reason,
    yarnWhyRaw,
    npmLsRaw,
    resolutionEntries,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
