import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { FixInput } from './types';

export function runCmd(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e: any) {
    return e.stdout ?? '';
  }
}

export function runCmdOrThrow(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function cleanInstall(): void {
  console.log('Cleaning dist, node_modules, yarn.lock and reinstalling...');
  execSync('rm -rf dist node_modules yarn.lock', { stdio: 'inherit' });
  execSync('yarn install --no-immutable', { stdio: 'inherit' });
}

export function reinstallWithoutLockRefresh(): void {
  console.log('Removing node_modules and reinstalling from yarn.lock...');
  execSync('rm -rf node_modules', { stdio: 'inherit' });
  execSync('yarn install --no-immutable', { stdio: 'inherit' });
}

export function sanitizePackageFilename(pkg: string): string {
  return pkg.replace(/^@/, '').replace(/\//g, '__');
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

/**
 * Parse fixes from:
 * 1. Line format (preferred for GHA UI):
 *      protobufjs@7.6.5,8.6.6
 *      brace-expansion@2.0.2
 *    (also accepts `;` as a separator on one line)
 * 2. JSON array (still supported)
 * 3. Path to a file containing either format
 */
export function parseFixesInput(raw: string): FixInput[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('fixes input is empty');
  }

  // Path to a file (not JSON / not a package@version line)
  const looksLikePath =
    !trimmed.startsWith('[') &&
    !trimmed.startsWith('{') &&
    !trimmed.includes('\n') &&
    !trimmed.includes(';') &&
    fs.existsSync(trimmed);
  if (looksLikePath) {
    return parseFixesInput(fs.readFileSync(trimmed, 'utf-8'));
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(normalizeFixInput);
  }

  return parseLineFormat(trimmed);
}

/** Parse `pkg@1.2.3` or `pkg@1.2.3,2.3.4` lines (scoped pkgs supported). */
function parseLineFormat(raw: string): FixInput[] {
  const lines = raw
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (!lines.length) {
    throw new Error(
      'fixes must be one package per line: package@version[,version...]',
    );
  }

  return lines.map((line) => {
    const at = line.lastIndexOf('@');
    if (at <= 0) {
      throw new Error(
        `Invalid fix line "${line}". Expected package@version[,version...]`,
      );
    }
    const pkg = line.slice(0, at).trim();
    const versions = line
      .slice(at + 1)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!pkg || !versions.length) {
      throw new Error(
        `Invalid fix line "${line}". Expected package@version[,version...]`,
      );
    }
    return normalizeFixInput({ package: pkg, fixedVersions: versions });
  });
}

export function normalizeFixInput(item: FixInput): FixInput {
  if (!item?.package) {
    throw new Error(
      `Each fix entry requires a "package" field: ${JSON.stringify(item)}`,
    );
  }
  return item;
}

/** Resolve fixed versions from either `fixes` map or `fixedVersions` array. */
export function getFixedVersions(input: FixInput): string[] {
  if (input.fixedVersions?.length) {
    return input.fixedVersions;
  }
  if (input.fixes && Object.keys(input.fixes).length > 0) {
    return Object.values(input.fixes);
  }
  throw new Error(
    `No fixed versions for package ${input.package}: provide "fixedVersions" or "fixes"`,
  );
}

export function getArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return undefined;
}

export function requireArg(flag: string): string {
  const value = getArg(flag);
  if (!value) {
    console.error(`Missing required argument: ${flag}`);
    process.exit(1);
  }
  return value;
}

/** Parse `parent@1.2.3 (...)` from parentUpgradeSuggestions. */
export function parseParentUpgradeTarget(
  suggestion: string,
): { pkg: string; version: string } | null {
  const bare = suggestion.trim().split(/\s+/)[0];
  const at = bare.lastIndexOf('@');
  if (at <= 0) return null;
  return { pkg: bare.slice(0, at), version: bare.slice(at + 1) };
}
