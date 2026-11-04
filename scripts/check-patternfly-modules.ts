import { parseSyml } from '@yarnpkg/parsers';
import { readFileSync } from 'fs';
import * as semver from 'semver';

console.log('Checking yarn.lock for PatternFly module resolutions...');

const lockFileContent = readFileSync('yarn.lock', 'utf8');
const lockFile = parseSyml(lockFileContent);

const PKGS_TO_CHECK = [
  { name: '@patternfly/react-charts', semver: '8.x' },
  { name: '@patternfly/react-component-groups', semver: '6.x' },
  { name: '@patternfly/react-core', semver: '6.x' },
  { name: '@patternfly/react-drag-drop', semver: '6.x' },
  { name: '@patternfly/react-icons', semver: '6.x' },
  { name: '@patternfly/react-log-viewer', semver: '6.x' },
  { name: '@patternfly/react-styles', semver: '6.x' },
  { name: '@patternfly/react-table', semver: '6.x' },
  { name: '@patternfly/react-tokens', semver: '6.x' },
  { name: '@patternfly/react-topology', semver: '6.x' },
  { name: '@patternfly/react-virtualized-extension', semver: '6.x' },
];

const patternflyModules = new Map<string, string[]>();

for (const [key, value] of Object.entries(lockFile)) {
  for (const pkg of PKGS_TO_CHECK) {
    if (key.startsWith(`${pkg.name}@`)) {
      if (!patternflyModules.has(pkg.name)) {
        patternflyModules.set(pkg.name, []);
      }
      const ver = (value as any).version;
      if (ver && !patternflyModules.get(pkg.name)!.includes(ver)) {
        patternflyModules.get(pkg.name)!.push(ver);
      }
    }
  }
}

let hasErrors = false;

for (const pkg of PKGS_TO_CHECK) {
  const versions = patternflyModules.get(pkg.name) || [];
  if (versions.length === 0) {
    console.log(`  SKIP  ${pkg.name} — not in yarn.lock`);
  } else if (versions.length === 1) {
    const coerced = semver.coerce(versions[0]);
    if (coerced && semver.satisfies(coerced, pkg.semver)) {
      console.log(`  OK    ${pkg.name} → ${versions[0]}`);
    } else {
      console.error(
        `  FAIL  ${pkg.name} → ${versions[0]} (expected ${pkg.semver})`,
      );
      hasErrors = true;
    }
  } else {
    console.error(`  FAIL  ${pkg.name} → MULTIPLE: ${versions.join(', ')}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\nRun: yarn why <pkg-name> to inspect resolution details');
  process.exit(1);
} else {
  console.log('\nNo issues detected');
}
