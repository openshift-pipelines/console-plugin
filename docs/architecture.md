# Architecture: Openshift Pipelines console-plugin

## OpenShift Web Console in a Nutshell

The OpenShift Web Console uses a microfrontend architecture, where different
features are delivered as independent console plugins that integrate into the
main console UI.

OpenShift Pipelines (OSP) provides its UI through one such plugin called the
**pipelines console plugin**.

Instead of directly modifying the core console, plugins integrate with the
console through a **plugin manifest**. This manifest defines a set of extensions
that tell the console:

- What UI components the plugin provides
- Where they should appear in the console

When the console loads, it fetches the plugin configuration from the API endpoint:

```
/api/plugins/pipelines-console-plugin/plugin-manifest.json
```

This request can be seen in the browser Network tab.

The plugin manifest contains the extension definitions that allow the plugin to
register.

### Key Point

The OpenShift Pipelines UI is coupled to the OpenShift Web Console through these
extensions. The console reads the extensions from the plugin manifest and
dynamically loads the UI components provided by the plugin.

This design allows OpenShift to:

- Keep the core console modular
- Allow independent feature development
- Load functionality dynamically through plugins

For more information related to the console architecture please reach out to the
OpenShift Console Team.

## Data Flow

```
User browser
  │
  ▼
OpenShift Console (React host)
  │
  ├── SDK hooks (useK8sWatchResource) ──▶ K8s API (watch/list CRDs)
  │
  ├── consoleFetchJSON ──▶ Console backend proxy ──▶ Tekton Results API
  │                                                   (summary, records)
  └── Plugin static assets ◀── nginx container (this repo's build output)
```

## Key Tekton CRDs Managed

| CRD          | API Group                           | Used For                    |
| ------------ | ----------------------------------- | --------------------------- |
| Pipeline     | tekton.dev/v1                       | Pipeline definitions        |
| PipelineRun  | tekton.dev/v1                       | Pipeline executions         |
| Task         | tekton.dev/v1                       | Task definitions            |
| TaskRun      | tekton.dev/v1                       | Task executions             |
| Repository   | pipelinesascode.tekton.dev/v1alpha1 | Pipelines-as-Code git repos |
| ApprovalTask | openshift-pipelines.org/v1alpha1    | Manual approval gates       |

## Build & Deployment

- **Build**: `yarn build` produces Webpack bundles in `dist/`
- **Container**: `Dockerfile` produces UBI nginx image serving `dist/`
- **Deployment**: Helm chart or operator installs `ConsolePlugin` CR +
  Deployment + Service pointing to the nginx pod
- **CI**: ci-operator (openshift/release) runs `yarn build` + `./test-frontend.sh`;
  GitHub Actions builds container images; Konflux builds productized images
