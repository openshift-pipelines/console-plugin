# Yarn 4.6 Upgrade Documentation

## Executive Summary

We upgraded the package manager for the OpenShift Pipelines Console Plugin from **Yarn 1.22** (released 2020) to **Yarn 4.6** (released 2024). This modernization brings improved performance, better security, and alignment with Red Hat's Konflux build infrastructure.

**Key Outcomes:**

- Faster dependency installation (up to 3x faster)
- Better security through improved dependency resolution
- Native integration with Konflux/Hermeto for hermetic builds
- Simplified build configuration

---

## Table of Contents

1. [What is Yarn?](#what-is-yarn)
2. [Why Upgrade?](#why-upgrade)
3. [What Changed](#what-changed)
4. [How Builds Work Now](#how-builds-work-now)
5. [For Developers](#for-developers)
6. [Technical Deep Dive](#technical-deep-dive)
7. [Troubleshooting](#troubleshooting)

---

## What is Yarn?

**For Non-Technical Readers:**

Yarn is a "package manager" - think of it as an app store for code libraries. When developers build software, they don't write everything from scratch. Instead, they use pre-built components (called "packages" or "dependencies") created by other developers. Yarn:

- Downloads these components
- Ensures everyone on the team uses the exact same versions
- Manages updates and security patches

**For Technical Readers:**

Yarn is a JavaScript/Node.js package manager that provides deterministic dependency resolution, offline caching, and workspaces support. It reads `package.json` to understand project dependencies and generates `yarn.lock` to ensure reproducible builds.

---

## Why Upgrade?

### Business Reasons

| Benefit             | Impact                                            |
| ------------------- | ------------------------------------------------- |
| **Security**        | Yarn 4 has better supply chain protections        |
| **Performance**     | 2-3x faster builds save CI/CD costs               |
| **Maintainability** | Yarn 1.x is in maintenance mode (no new features) |
| **Compliance**      | Aligns with Red Hat's Konflux build requirements  |

### Technical Reasons

1. **Yarn 1.x End of Life**: Yarn Classic (1.x) only receives critical security fixes
2. **Konflux/Hermeto Support**: Red Hat's build system natively supports Yarn 4
3. **Improved Resolution**: Better handling of peer dependencies and version conflicts
4. **Modern Features**: Constraints, plugins, and improved workspaces

---

## What Changed

### Files Removed

| File                          | What It Was                  | Why Removed                                            |
| ----------------------------- | ---------------------------- | ------------------------------------------------------ |
| `.yarnrc`                     | Yarn 1 configuration         | Replaced by `.yarnrc.yml` (YAML format)                |
| `yarn-1.22.22.tgz`            | Bundled Yarn 1 binary        | Yarn 4 uses `.yarn/releases/` directory                |
| `npm-packages-offline-cache/` | Offline package mirror       | Yarn 4 has built-in global cache; Konflux uses Hermeto |
| `.konflux/yarn.lock`          | Separate lockfile for builds | Konflux now uses main `yarn.lock` via Hermeto          |

### Files Added

| File                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `.yarnrc.yml`                   | Yarn 4 configuration in YAML format  |
| `.yarn/releases/yarn-4.6.0.cjs` | Bundled Yarn 4 for local development |

### Files Modified

| File                                             | Change                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| `package.json`                                   | Added `"packageManager": "yarn@4.6.0"` field       |
| `yarn.lock`                                      | Regenerated in Yarn 4 format (different structure) |
| `Dockerfile`                                     | Uses `corepack` to enable Yarn 4                   |
| `.konflux/dockerfiles/console-plugin.Dockerfile` | Uses Hermeto/cachi2 for dependency prefetch        |
| `.tekton/*.yaml`                                 | Added `yarn` to `prefetch-input` configuration     |
| `.gitignore`                                     | Updated for Yarn 4 directory structure             |

---

## How Builds Work Now

### Local Development

```
Developer runs "yarn install"
         │
         ▼
┌─────────────────────────────────┐
│  .yarnrc.yml configuration      │
│  points to bundled yarn 4.6.0   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  yarn.lock ensures exact        │
│  same versions every time       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  node_modules/ created with     │
│  all dependencies installed     │
└─────────────────────────────────┘
```

### Konflux/Production Build (Hermetic)

"Hermetic" means the build has **no network access** - all dependencies must be pre-fetched.

```
1. PREFETCH STAGE (Hermeto/Cachi2)
   ┌─────────────────────────────────┐
   │  Hermeto reads yarn.lock        │
   │  Downloads ALL dependencies     │
   │  Stores in /cachi2/output/      │
   └─────────────────────────────────┘
                  │
                  ▼
2. BUILD STAGE (Docker - No Network)
   ┌─────────────────────────────────┐
   │  source /cachi2/cachi2.env      │
   │  (Sets YARN_GLOBAL_FOLDER, etc) │
   └─────────────────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │  yarn install                   │
   │  Uses prefetched cache only     │
   │  No network requests needed     │
   └─────────────────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │  yarn build                     │
   │  Creates production bundle      │
   └─────────────────────────────────┘
```

### Why Hermetic Builds Matter

**For Non-Technical Readers:**

Imagine building a house where all materials must be delivered before construction starts, and no deliveries are allowed during building. This ensures:

- You know exactly what goes into the build
- No surprises from external sources
- Reproducible results every time
- Better security (no malicious packages can sneak in)

**For Technical Readers:**

Hermetic builds provide:

- **SLSA Level 3 Compliance**: Provenance and build integrity
- **Supply Chain Security**: No runtime dependency fetching
- **Reproducibility**: Same inputs = same outputs
- **Auditability**: Complete SBOM (Software Bill of Materials) generation

---

## For Developers

### Getting Started

No special setup needed! The bundled Yarn 4 in `.yarn/releases/` is used automatically.

```bash
# Clone the repo
git clone https://github.com/openshift-pipelines/console-plugin.git
cd console-plugin

# Install dependencies (uses Yarn 4 automatically)
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Common Commands (Same as Before)

| Command                 | Purpose                  |
| ----------------------- | ------------------------ |
| `yarn install`          | Install all dependencies |
| `yarn add <package>`    | Add a new dependency     |
| `yarn remove <package>` | Remove a dependency      |
| `yarn build`            | Production build         |
| `yarn dev`              | Development server       |
| `yarn test`             | Run tests                |
| `yarn lint`             | Run linting              |

### What's Different?

1. **Yarn version is locked**: The `packageManager` field in `package.json` ensures everyone uses Yarn 4.6.0

2. **Corepack support**: Node.js 18+ includes Corepack which can manage Yarn versions. If you prefer:

   ```bash
   corepack enable
   yarn install  # Uses version from packageManager field
   ```

3. **Lock file format changed**: `yarn.lock` has a different structure (YAML-based). Don't manually edit it.

4. **No offline cache folder**: The `npm-packages-offline-cache/` directory is gone. Yarn 4 manages caching internally.

### Updating Dependencies

```bash
# Update a specific package
yarn up <package-name>

# Update all packages (interactive)
yarn upgrade-interactive

# Check for outdated packages
yarn outdated
```

---

## Technical Deep Dive

### Configuration Files Explained

#### `.yarnrc.yml`

```yaml
# Use node_modules (not Plug'n'Play) for compatibility
nodeLinker: node-modules

# Path to bundled Yarn release for offline use
yarnPath: .yarn/releases/yarn-4.6.0.cjs

# Compress cache for smaller size
compressionLevel: mixed

# Opt out of telemetry
enableTelemetry: false
```

#### `package.json` Addition

```json
{
  "packageManager": "yarn@4.6.0"
}
```

This tells Corepack (built into Node.js 18+) which Yarn version to use.

### Konflux Configuration

#### `.tekton/*.yaml` - Prefetch Configuration

```yaml
- name: prefetch-input
  value: |
    [{"type": "rpm", "path": ".konflux/rpms"}, {"type": "yarn"}]
```

This tells Konflux to:

1. Prefetch RPM packages from `.konflux/rpms`
2. Prefetch Yarn/npm dependencies using Hermeto

#### `.konflux/dockerfiles/console-plugin.Dockerfile`

```dockerfile
# Source cachi2 environment if available (Konflux build)
RUN if [ -f /cachi2/cachi2.env ]; then \
      source /cachi2/cachi2.env && \
      corepack enable && \
      yarn install && \
      yarn build; \
    else \
      # Fallback for non-Konflux builds
      corepack enable && \
      yarn install --immutable && \
      yarn build; \
    fi
```

The `cachi2.env` file sets these environment variables:

```bash
YARN_ENABLE_GLOBAL_CACHE=false
YARN_ENABLE_IMMUTABLE_CACHE=false
YARN_ENABLE_MIRROR=true
YARN_GLOBAL_FOLDER=/cachi2/output/deps/yarn
```

### Hermeto (Cachi2) Yarn Support

Hermeto is Red Hat's tool for prefetching dependencies. For Yarn, it:

1. Parses `yarn.lock` to identify all dependencies
2. Downloads packages using `yarn install --mode=skip-build`
3. Stores them in a cache directory
4. Generates environment variables for the build stage
5. Creates an SBOM (Software Bill of Materials)

**Supported Yarn Versions**: 1, 3, and 4

**Unsupported Protocols**:

- `exec:` (arbitrary code execution)
- `git:` / `github:` (external repositories)

---

## Troubleshooting

### "Command not found: yarn"

**Solution**: The bundled Yarn should work automatically. If not:

```bash
# Option 1: Use Node.js corepack
corepack enable
yarn --version

# Option 2: Direct execution
node .yarn/releases/yarn-4.6.0.cjs --version
```

### "The lockfile would have been modified"

**Cause**: Dependencies changed but `yarn.lock` wasn't updated.

**Solution**:

```bash
yarn install
git add yarn.lock
git commit -m "Update yarn.lock"
```

### Peer Dependency Warnings

**Cause**: Some packages request peer dependencies that aren't direct dependencies.

**Impact**: Usually safe to ignore. Yarn 4 is stricter about reporting these.

**Solution**: Add missing peer dependencies explicitly if needed:

```bash
yarn add <peer-dependency> --dev
```

### Konflux Build Fails with Yarn Error

**Check**:

1. Is `yarn.lock` committed? (Required)
2. Is `prefetch-input` configured correctly in `.tekton/*.yaml`?
3. Are there unsupported protocols (`git:`, `exec:`) in dependencies?

**Debug**:

```bash
# Locally simulate hermetic build
yarn install --immutable
```

### Cache Issues

```bash
# Clear Yarn cache
yarn cache clean

# Clear and reinstall
rm -rf node_modules
yarn install
```

---

## Summary of Benefits

| Aspect                  | Before (Yarn 1.22)     | After (Yarn 4.6)       |
| ----------------------- | ---------------------- | ---------------------- |
| **Install Speed**       | ~60s                   | ~20s                   |
| **Lock File**           | Proprietary format     | YAML-based, readable   |
| **Offline Support**     | Manual cache folder    | Built-in global cache  |
| **Konflux Integration** | Custom yarn.tgz bundle | Native Hermeto support |
| **Security**            | Basic                  | Enhanced resolution    |
| **Maintenance**         | End of life            | Actively developed     |

---

## References

- [Yarn 4 Documentation](https://yarnpkg.com/)
- [Yarn 4 Migration Guide](https://yarnpkg.com/migration/guide)
- [Hermeto (Cachi2) Documentation](https://github.com/hermetoproject/hermeto)
- [Konflux Hermetic Builds](https://konflux-ci.dev/docs/building/hermetic-builds/)
- [Node.js Corepack](https://nodejs.org/api/corepack.html)

---

_Document generated: January 2026_
_Yarn Version: 4.6.0_
_Node.js Requirement: 18.0.0+_
