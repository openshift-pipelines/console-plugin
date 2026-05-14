---
name: add-resource-page
description: Add a new Tekton resource list or details page to the console plugin. Use when creating UI for a new CRD, adding a list page, or registering a new console extension point.
---

# Add a New Tekton Resource Page

## Steps

### 1. Define the K8s Model (`src/models.ts`)

```ts
export const MyResourceModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'MyResource',
  labelKey: 'MyResource',
  labelPluralKey: 'MyResources',
  plural: 'myresources',
  abbr: 'MR',
  namespaced: true,
  kind: 'MyResource',
  id: 'myresource',
  labelPlural: 'MyResources',
  crd: true,
  color,
};
```

### 2. Create Component Directory

Create `src/components/myresource-list/` with:

- `MyResourceListPage.tsx` — wraps `ListPageHeader` + list
- `MyResourcesList.tsx` — `useK8sWatchResource` + `VirtualizedTable`
- `MyResourceRow.tsx` — table row renderer
- `useMyResourceColumns.ts` — column definitions
- `index.ts` — barrel export

### 3. Register Console Extension (`console-extensions.json`)

```json
{
  "type": "console.page/route",
  "properties": {
    "path": ["/pipelines/ns/:ns/myresource"],
    "component": { "$codeRef": "myResourceListPage.default" }
  },
  "flags": { "required": ["OPENSHIFT_PIPELINE"] }
}
```

Add `exposedModules` in `package.json` → `consolePlugin` section.

### 4. Feature Flag (if new CRD)

Add `console.flag/model` entry in `console-extensions.json` so the page
renders only when the CRD exists on the cluster.

### 5. i18n

Use `useTranslation('plugin__pipelines-console-plugin')`. Run `yarn i18n`.

### 6. Tests

Add Jest tests (e.g., `__tests__/MyResourcesList.spec.tsx`). Use mock data
from `src/test-data/`.

## Reference Implementations

- **List page**: `src/components/pipelines-list/PipelineListPage.tsx`
- **Row**: `src/components/pipelines-list/PipelineRow.tsx`
- **Columns hook**: `src/components/pipelines-list/usePipelinesColumns.ts`
- **Model**: `src/models.ts` → `PipelineModel`
