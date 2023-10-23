#!/usr/bin/env bash 

set -euo pipefail

CONSOLE_PLUGIN_IMAGE=${CONSOLE_PLUGIN_IMAGE:="quay.io/openshift-pipeline/console-plugin:latest"}

echo "Building the Console Plugin Image ..."

# Prefer podman if installed. Otherwise, fall back to docker 
if [ -x "$(command -v podman)" ]; then 
    podman build -t "${CONSOLE_PLUGIN_IMAGE}" .
    podman push "${CONSOLE_PLUGIN_IMAGE}"

    echo "Pushed ${CONSOLE_PLUGIN_IMAGE}"
else
    docker build -t "${CONSOLE_PLUGIN_IMAGE}" --push .

    echo "Pushed ${CONSOLE_PLUGIN_IMAGE}"
fi
