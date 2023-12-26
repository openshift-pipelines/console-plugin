# OpenShift Console Plugin for Tekton CD / OpenShift Pipelines

:construction: This is a WIP [dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) that extends the [OpenShift Console](https://github.com/openshift/console) by adding **Tekton CD / OpenShift Pipelines** specific features.

It will be shipped and enabled automatically by the [Tekton CD / OpenShift Pipelines operator](https://github.com/tektoncd/operator).

## Rough roadmap

- 2023 / v1: Adds a new **Dashboard** and **Metrics** tab to the Pipeline pages that shows aggregated PipelineRun stats from the [Tekton Results API](https://github.com/tektoncd/results)
- 2024 / v2: Additional pages, like the Pipeline list and details pages are moved from the "static" [pipelines-plugin](https://github.com/openshift/console/tree/master/frontend/packages/pipelines-plugin) from the OpenShift Console into this project.

## Compatiblity

This initial version of this plugin will be shipped with OpenShift Pipelines operator 1.1x and requires at least OpenShift 4.1x (TBD).

See also the OpenShift Pipelines [Compatibility and support matrix](https://docs.openshift.com/pipelines/latest/about/op-release-notes.html#compatibility-support-matrix_op-release-notes).
