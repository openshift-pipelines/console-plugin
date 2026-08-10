#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * scan.ts
 *
 * Runs `npm audit --json`, parses the advisory output, and produces a
 * fixes.json file in the format expected by apply-fix.ts (--fixes).
 *
 * This closes the gap between "we know there are CVEs" and "we have the
 * structured input apply-fix needs" — previously that mapping was manual.
 *
 * Usage:
 *   yarn ts-node scripts/fix-cves/scan.ts \
 *     --output cve-artifacts/fixes.json \
 *     [--severity high,critical]          # default: high,critical
 *     [--ignore GHSA-xxxx-yyyy-zzzz,...]  # comma-separated advisory IDs to skip
 *
 * Output format (subset of npm audit advisory):
 *   [
 *     { "package": "semver", "fixedVersions": ["7.5.2"] },
 *     { "package": "tough-cookie", "fixedVersions": ["4.1.3"] }
 *   ]
 *
 * Why this exists:
 *   apply-fix.ts requires a fixes.json to be pre-populated. Without scan.ts,
 *   engineers have to manually read `npm audit` output and transcribe package
 *   names and versions — error-prone and slow. scan.ts automates that step so
 *   the full pipeline can run unattended: scan → apply → verify → report.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';
import semver from 'semver';
import { ensureDir, getArg, writeFile } from './utils';

// ---------------------------------------------------------------------------
// Types (npm audit v7+ JSON shape, simplified)
// ---------------------------------------------------------------------------

interface NpmAuditAdvisory {
  id: number;
  ghsa_id?: string;
  cve?: string[];
  title: string;
  module_name: string;
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  patched_versions: string;
  findings: Array<{ version: string; paths: string[] }>;
}

interface NpmAuditOutput {
  advisories?: Record<string, NpmAuditAdvisory>;
  // npm audit v7 "audit" format
  vulnerabilities?: Record<
    string,
    {
      name: string;
      severity: string;
      via: Array<
        | string
        | {
            source: number;
            name: string;
            title: string;
            url: string;
            severity: string;
            range: string;
          }
      >;
      fixAvailable: boolean | { name: string; version: string };
      nodes: string[];
    }
  >;
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
}

interface FixEntry {
  package: string;
  fixedVersions: string[];
  advisoryIds: string[];
  severity: string;
  title: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSeverityFilter(raw: string): Set<string> {
  return new Set(raw.split(',').map((s) => s.trim().toLowerCase()));
}

function parseIgnoreList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(raw.split(',').map((s) => s.trim()));
}

function runAudit(): NpmAuditOutput {
  try {
    const out = execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024,
    });
    return JSON.parse(out) as NpmAuditOutput;
  } catch (e: any) {
    // npm audit exits non-zero when vulnerabilities are found;
    // stdout still contains the JSON we need
    try {
      return JSON.parse(e.stdout ?? '{}') as NpmAuditOutput;
    } catch {
      console.error('Failed to parse npm audit JSON output');
      process.exit(1);
    }
  }
}

/**
 * Extract the lowest semver version that satisfies the patched_versions range.
 * If patched_versions is "*" or empty, there is no fix yet.
 */
function resolveFixedVersion(patchedVersions: string): string | null {
  if (!patchedVersions || patchedVersions === '*') return null;
  // patched_versions is a semver range like ">=7.5.2" or ">=2.0.1 <3.0.0 || >=3.0.1"
  // We want the minimum satisfying version — use minVersion for a reliable lower bound.
  const min = semver.minVersion(patchedVersions);
  return min?.version ?? null;
}

/**
 * Parse legacy npm audit v6 format (advisories map).
 */
function parseLegacyFormat(
  audit: NpmAuditOutput,
  severityFilter: Set<string>,
  ignoreList: Set<string>,
): FixEntry[] {
  if (!audit.advisories) return [];
  const byPackage = new Map<string, FixEntry>();

  for (const [id, advisory] of Object.entries(audit.advisories)) {
    if (!severityFilter.has(advisory.severity)) continue;

    const ghsaId = advisory.ghsa_id ?? `npm-${id}`;
    if (ignoreList.has(ghsaId) || ignoreList.has(id)) continue;

    const fixedVersion = resolveFixedVersion(advisory.patched_versions);
    if (!fixedVersion) {
      console.warn(
        `⚠ No fixed version available for ${advisory.module_name} (${ghsaId}) — skipping`,
      );
      continue;
    }

    const existing = byPackage.get(advisory.module_name);
    if (existing) {
      if (!existing.fixedVersions.includes(fixedVersion)) {
        existing.fixedVersions.push(fixedVersion);
      }
      if (!existing.advisoryIds.includes(ghsaId)) {
        existing.advisoryIds.push(ghsaId);
      }
    } else {
      byPackage.set(advisory.module_name, {
        package: advisory.module_name,
        fixedVersions: [fixedVersion],
        advisoryIds: [ghsaId],
        severity: advisory.severity,
        title: advisory.title,
      });
    }
  }

  return [...byPackage.values()];
}

/**
 * Parse npm audit v7 format (vulnerabilities map).
 * The v7 format is more compact; each vuln has a `via` array that may
 * reference advisory source IDs rather than full advisory objects.
 */
function parseV7Format(
  audit: NpmAuditOutput,
  severityFilter: Set<string>,
  ignoreList: Set<string>,
): FixEntry[] {
  if (!audit.vulnerabilities) return [];
  const entries: FixEntry[] = [];

  for (const [pkgName, vuln] of Object.entries(audit.vulnerabilities)) {
    if (!severityFilter.has(vuln.severity)) continue;
    if (!vuln.fixAvailable) continue;
    // v7 format has no stable advisory ID — allow ignoring by package name
    if (ignoreList.has(pkgName)) continue;

    let fixedVersion: string | null = null;
    let title = '';

    if (typeof vuln.fixAvailable === 'object' && vuln.fixAvailable.version) {
      fixedVersion = vuln.fixAvailable.version;
    }

    // Pull advisory details from via entries; also collect any source IDs
    // that appear as numeric strings so --ignore can match them if present.
    const advisoryIds: string[] = [];
    for (const via of vuln.via) {
      if (typeof via === 'object') {
        title = title || via.title;
        const min = via.range ? semver.minVersion(via.range) : null;
        if (min && !fixedVersion) fixedVersion = min.version;
        // source is a numeric registry ID — surface it so callers can ignore it
        if (via.source) advisoryIds.push(String(via.source));
      } else if (typeof via === 'string') {
        advisoryIds.push(via);
      }
    }

    // Also honour ignore list against any collected advisory IDs
    if (advisoryIds.some((id) => ignoreList.has(id))) continue;

    if (!fixedVersion) {
      console.warn(
        `⚠ Could not determine fixed version for ${pkgName} — skipping`,
      );
      continue;
    }

    entries.push({
      package: pkgName,
      fixedVersions: [fixedVersion],
      advisoryIds,
      severity: vuln.severity,
      title,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const outputPath = getArg('--output') ?? 'cve-artifacts/fixes.json';
  const severityRaw = getArg('--severity') ?? 'high,critical';
  const ignoreRaw = getArg('--ignore');

  const severityFilter = parseSeverityFilter(severityRaw);
  const ignoreList = parseIgnoreList(ignoreRaw);

  console.log(
    `Running npm audit (severity filter: ${[...severityFilter].join(', ')})…`,
  );
  const audit = runAudit();

  // Support both npm audit v6 and v7 output formats
  const entries = audit.advisories
    ? parseLegacyFormat(audit, severityFilter, ignoreList)
    : parseV7Format(audit, severityFilter, ignoreList);

  if (entries.length === 0) {
    console.log(
      'No actionable vulnerabilities found at the specified severity level.',
    );
  } else {
    console.log(`Found ${entries.length} vulnerable package(s):`);
    for (const e of entries) {
      console.log(
        `  ${e.package} — ${e.severity} — fix: ${e.fixedVersions.join(
          ', ',
        )} — ${e.title}`,
      );
    }
  }

  ensureDir(path.dirname(outputPath));
  writeFile(outputPath, JSON.stringify(entries, null, 2) + '\n');
  console.log(`\nWrote fixes input to ${outputPath}`);
  console.log(
    `Next step: yarn ts-node scripts/fix-cves/apply-fix.ts --fixes ${outputPath}`,
  );
}

main();
