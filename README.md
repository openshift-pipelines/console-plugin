# OpenShift Console Plugin for Tekton CD / OpenShift Pipelines

This is a [dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) that extends the [OpenShift Console](https://github.com/openshift/console) by adding **Tekton CD / OpenShift Pipelines** specific features.

It is shipped and enabled automatically by the [Tekton CD / OpenShift Pipelines operator](https://github.com/tektoncd/operator).

## Installation

```bash
yarn install
```

Requires [Node.js](https://nodejs.org/) >= 22 with [Corepack](https://nodejs.org/api/corepack.html) enabled and [yarn](https://yarnpkg.com/).

## Usage

```bash
yarn start          # Start webpack dev server on :9001
yarn build          # Production build
yarn test           # Run unit tests
yarn lint           # ESLint + Stylelint
```

To run with an OpenShift Console instance:

```bash
oc login <cluster>
yarn run start-console
```

Navigate to <http://localhost:9000> to see the running plugin.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow (local, container, and devcontainer options).

Key development commands:

- `yarn dev` — development build with hot reload
- `yarn generate-types` — regenerate API types from `openapi/spec.yml`
- `yarn i18n` — rebuild translation files after string changes

## Features

- **Tekton CD `Pipeline`, `PipelineRun`, `Task`, `TaskRun`, and OpenShift `Repository` list and details pages**
- **Start and re-run PipelineRuns directly from the UI**
- **Topology view** extended to show latest PipelineRun status
- **Dashboard and Metrics tabs** with statistics from the [Tekton Results API](https://github.com/tektoncd/results)
- **Tech Preview: [Manual approvals with ApprovalTasks](https://docs.openshift.com/pipelines/latest/create/using-manual-approval.html)**

## Compatibility

This plugin is shipped with OpenShift Pipelines operator and requires at least OpenShift 4.15+.

See the [OpenShift Pipelines compatibility and support matrix](https://docs.openshift.com/pipelines/latest/about/op-release-notes.html#compatibility-support-matrix_op-release-notes).
