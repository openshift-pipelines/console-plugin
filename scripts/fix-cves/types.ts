/** Shared types for CVE remediation scripts. */

export type RemediationStrategy =
  | 'already-remediated'
  | 'direct-upgrade'
  | 'parent-upgrade'
  | 'resolution'
  | 'triage-needed';

/** Input shape accepted by the workflow `fixes` parameter. */
export interface FixInput {
  package: string;
  /** Map of major version → fixed version, e.g. { "3": "3.15.0" }. */
  fixes?: Record<string, string>;
  /** Explicit list of fixed versions. */
  fixedVersions?: string[];
}

/** JSON output from analyze-deps.ts (subset we consume). */
export interface AnalysisResult {
  package: string;
  currentVersion: string | null;
  fixedVersion: string;
  isSharedWithSDK: boolean;
  dependencyChains: string[];
  directParents: string[];
  parentUpgradeAvailable: boolean;
  parentUpgradeSuggestions: string[];
  fixedVersionAvailable: boolean;
  availableVersions: string[];
  strategy: RemediationStrategy;
  reason: string;
  yarnWhyRaw: string;
  npmLsRaw: string;
  resolutionEntries: Record<string, string>;
}

export interface PackageFixResult {
  package: string;
  fixedVersions: string[];
  strategy: RemediationStrategy;
  fixedVersion: string;
  reason: string;
  appliedAction: string;
  analysisPath: string;
  verified: boolean | null;
  verificationDetail: string;
  yarnWhyRaw: string;
  npmLsRaw: string;
  verifyYarnWhy?: string;
  verifyNpmLs?: string;
}

export interface FixRunResults {
  jiraId: string;
  releaseBranch: string;
  packages: PackageFixResult[];
  triageNeeded: boolean;
  verificationFailed: boolean;
  buildPassed?: boolean | null;
  testPassed?: boolean | null;
  prUrl?: string;
}
