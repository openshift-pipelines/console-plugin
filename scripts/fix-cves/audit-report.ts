#!/usr/bin/env npx ts-node --project scripts/fix-cves/tsconfig.json

/**
 * audit-report.ts
 *
 * Generates a human-readable Markdown report from the artifacts produced by
 * apply-fix.ts and verify-fix.ts. Intended to be attached to a Jira ticket,
 * PR description, or compliance audit trail.
 *
 * Usage:
 *   yarn ts-node scripts/fix-cves/audit-report.ts \
 *     --artifacts-dir cve-artifacts \
 *     --output cve-artifacts/report.md
 *
 * Why this exists:
 *   The JSON artifacts are machine-readable but not reviewer-friendly.
 *   Security teams and auditors need a concise summary of what was vulnerable,
 *   what was changed, and confirmation that verification passed — without
 *   reading raw JSON or running the tools themselves.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { FixRunResults, PackageFixResult } from './types';
import { getArg, readJson } from './utils';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const STATUS_ICON: Record<string, string> = {
  'already-remediated': '✅',
  'direct-upgrade': '🔧',
  'parent-upgrade': '🔧',
  resolution: '📌',
  'triage-needed': '⚠️',
};

function strategyLabel(strategy: PackageFixResult['strategy']): string {
  const labels: Record<string, string> = {
    'already-remediated': 'Already remediated',
    'direct-upgrade': 'Direct upgrade',
    'parent-upgrade': 'Parent upgrade',
    resolution: 'Yarn resolution pinned',
    'triage-needed': 'Manual triage required',
  };
  return labels[strategy] ?? strategy;
}

function verifiedBadge(pkg: PackageFixResult): string {
  if (pkg.strategy === 'triage-needed') return '⚠️ Triage needed';
  if (pkg.verified === true) return '✅ Verified';
  if (pkg.verified === false) return '❌ Failed';
  return '⏳ Not yet verified';
}

/**
 * Render a before/after evidence block for a single package.
 * "Before" = npm ls / yarn why captured by apply-fix before any changes.
 * "After"  = npm ls / yarn why captured by verify-fix after reinstall.
 *
 * Both sections are collapsible so reviewers can expand only what they need.
 * If a field is missing (e.g. verification hasn't run yet), that section
 * is omitted rather than rendered empty.
 */
function renderEvidence(pkg: PackageFixResult): string {
  const blocks: string[] = [];

  const hasBefore = pkg.npmLsRaw?.trim() || pkg.yarnWhyRaw?.trim();
  const hasAfter = pkg.verifyNpmLs?.trim() || pkg.verifyYarnWhy?.trim();

  if (!hasBefore && !hasAfter) return '';

  blocks.push('');
  blocks.push('<details>');
  blocks.push('<summary>📋 Before / after dependency evidence</summary>');
  blocks.push('');

  if (hasBefore) {
    if (pkg.npmLsRaw?.trim()) {
      blocks.push('**Before — `npm ls`**');
      blocks.push('');
      blocks.push('```');
      blocks.push(pkg.npmLsRaw.trim());
      blocks.push('```');
      blocks.push('');
    }
    if (pkg.yarnWhyRaw?.trim()) {
      blocks.push('**Before — `yarn why `**');
      blocks.push('');
      blocks.push('```');
      blocks.push(pkg.yarnWhyRaw.trim());
      blocks.push('```');
      blocks.push('');
    }
  }

  if (hasAfter) {
    if (pkg.verifyNpmLs?.trim()) {
      blocks.push('**After — `npm ls`**');
      blocks.push('');
      blocks.push('```');
      blocks.push(pkg.verifyNpmLs.trim());
      blocks.push('```');
      blocks.push('');
    }
    if (pkg.verifyYarnWhy?.trim()) {
      blocks.push('**After — `yarn why `**');
      blocks.push('');
      blocks.push('```');
      blocks.push(pkg.verifyYarnWhy.trim());
      blocks.push('```');
      blocks.push('');
    }
  }

  blocks.push('</details>');
  return blocks.join('\n');
}

function renderPackageSection(pkg: PackageFixResult, index: number): string {
  const icon = STATUS_ICON[pkg.strategy] ?? '❓';
  const lines: string[] = [
    `## ${index + 1}. \`${pkg.package}\``,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Fixed version(s) | ${pkg.fixedVersions.join(', ')} |`,
    `| Strategy | ${icon} ${strategyLabel(pkg.strategy)} |`,
    `| Reason | ${pkg.reason} |`,
    `| Action taken | ${pkg.appliedAction} |`,
    `| Verification | ${verifiedBadge(pkg)} |`,
  ];

  if (pkg.verificationDetail) {
    lines.push(`| Verification detail | ${pkg.verificationDetail} |`);
  }

  if (pkg.strategy === 'triage-needed') {
    lines.push(
      '',
      '> **Action required:** This package could not be auto-remediated.',
      '> Review the analysis artifact and apply a fix manually before closing this ticket.',
    );
  }

  // Collapsible before/after evidence — reviewers can expand to see the
  // raw npm ls / yarn why output captured before and after remediation.
  const evidence = renderEvidence(pkg);
  if (evidence) {
    lines.push(evidence);
  }

  return lines.join('\n');
}

function renderSummaryTable(packages: PackageFixResult[]): string {
  const rows = packages.map((pkg) => {
    const icon = STATUS_ICON[pkg.strategy] ?? '❓';
    return `| \`${pkg.package}\` | ${pkg.fixedVersions.join(
      ', ',
    )} | ${icon} ${strategyLabel(pkg.strategy)} | ${verifiedBadge(pkg)} |`;
  });

  return [
    '| Package | Fixed version(s) | Strategy | Verified |',
    '|---------|-----------------|----------|----------|',
    ...rows,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const artifactsDir = getArg('--artifacts-dir') ?? 'cve-artifacts';
  const outputPath = getArg('--output') ?? path.join(artifactsDir, 'report.md');
  const resultsPath =
    getArg('--results') ?? path.join(artifactsDir, 'results.json');
  const prUrl = getArg('--pr-url') ?? '';

  const results = readJson<FixRunResults>(resultsPath);
  const now = new Date().toISOString();

  const overallStatus = results.verificationFailed
    ? '❌ One or more packages failed verification'
    : results.triageNeeded
    ? '⚠️ One or more packages require manual triage'
    : '✅ All packages remediated and verified';

  const lines: string[] = [
    `# CVE Remediation Report`,
    '',
    `> Generated: ${now}`,
    results.jiraId ? `> Jira: ${results.jiraId}` : '',
    results.releaseBranch
      ? `> Release branch: \`${results.releaseBranch}\``
      : '',
    prUrl ? `> PR: ${prUrl}` : '',
    '',
    `## Overall status`,
    '',
    overallStatus,
    '',
    `## Summary`,
    '',
    renderSummaryTable(results.packages),
    '',
    `## Package details`,
    '',
    ...results.packages.flatMap((pkg, i) => [renderPackageSection(pkg, i), '']),
    '---',
    `*Report generated by \`audit-report.ts\`. Artifacts in \`${artifactsDir}/\`.*`,
  ].filter((l) => l !== undefined);

  const report = lines.join('\n') + '\n';
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf-8');

  console.log(`Wrote audit report to ${outputPath}`);
  if (results.verificationFailed || results.triageNeeded) {
    process.exitCode = 1;
  }
}

main();
