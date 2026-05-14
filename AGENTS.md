## Instructions for large language models and AI coding agents

You are working on an OpenShift dynamic console plugin that adds OpenShift Pipelines UI to the OpenShift Console. It is shipped and enabled by the OpenShift Pipelines operator and targets OpenShift 4.15+.

## Tech Stack

- TypeScript, React 18, PatternFly 6, Webpack 5
- Yarn 4 (Corepack), Node 22
- OpenShift Console Dynamic Plugin SDK (`@openshift-console/dynamic-plugin-sdk`)

## Repository Layout

- `src/components/` — UI (pipelines, pipelineRuns, tasks, topology, pac, approval-tasks, metrics)
- `src/types/` — generated from `openapi/spec.yml` via openapi-typescript
- `src/models.ts` — K8s resource models; `src/consts.ts` — shared constants
- `console-extensions.json` — extension points registered with the console
- `locales/` — i18n JSON; `scripts/` — build & tooling helpers

## Common Commands

```sh
yarn install && yarn start   # dev server on :9001
yarn build                   # production build
yarn test                    # Jest unit tests
yarn lint                    # ESLint + Stylelint (with --fix)
yarn generate-types          # regenerate API types from OpenAPI spec
yarn i18n                    # rebuild translation files
```

## CI/CD

- **ci-operator** (configured in `openshift/release` repo under
  `ci-operator/config/openshift-pipelines/console-plugin/`): runs `yarn build`
  and `./test-frontend.sh` (Jest) on every PR in the main and master branch.
- **Konflux/Productization** builds live in `openshift-pipelines/p12n-console-plugin`
  (`.tekton/` PipelineRuns, pushes to `quay.io/redhat-user-workloads`).
- **GitHub Actions** (`.github/workflows/`): container image build on push/PR;
  PRs go to `ttl.sh` (24h), releases to GHCR.

## Conventions

- CSS: prefix classes with `pipelines-console-plugin-`; no hex colors (use PF vars).
- i18n namespace: `plugin__pipelines-console-plugin`. Run `yarn i18n` after string changes.
- Extensions: add entries to `console-extensions.json` + `exposedModules` in `package.json`.
- Single-file lint: `npx eslint src/path/to/file.ts`
- Single-file type-check: `npx tsc --noEmit src/path/to/file.ts`

## Architecture

- Plugin loaded at runtime via Webpack module federation (`ConsoleRemotePlugin`).
- K8s interactions use the console SDK's `useK8sWatchResource` / `k8sGet` hooks.
- Tekton Results API accessed via `consoleFetchJSON` through the console backend proxy.
- Topology decorators use `@patternfly/react-topology`.

## Testing

- Unit: Jest + React Testing Library (`yarn test`)
- Integration: Cypress (`integration-tests/` workspace). Pattern: `.cursor/skills/add-resource-page/`
