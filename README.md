# OpenShift Console Plugin for Tekton CD / OpenShift Pipelines

This is a [dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) that extends the [OpenShift Console](https://github.com/openshift/console) by adding **Tekton CD / OpenShift Pipelines** specific features.

It is shipped and enabled automatically by the [Tekton CD / OpenShift Pipelines operator](https://github.com/tektoncd/operator).

## Features

- **Tekton CD `Pipeline`, `PipelineRun`, `Task`, `TaskRun`, and OpenShift `Repository` list and details pages**
- It allows users to **start and re-run PipelineRuns directly from the UI**
- It automatically extends the **Topology view to show the latest PipelineRun status**
- **New: Dashboard and Metrics tabs** that shows statistics from the **[Tekton Results API](https://github.com/tektoncd/results)**
- **Tech Preview: Support for [manual approvals with OpenShift Pipelines `ApprovalTasks`](https://docs.openshift.com/pipelines/latest/create/using-manual-approval.html)**

## Compatiblity

This plugin will be shipped with OpenShift Pipelines operator and requires at least OpenShift 4.15+.

You might be also interessted in the [OpenShift Pipelines compatibility and support matrix](https://docs.openshift.com/pipelines/latest/about/op-release-notes.html#compatibility-support-matrix_op-release-notes).
