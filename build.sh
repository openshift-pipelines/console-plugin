#!/usr/bin/env bash 

set -euo pipefail

CONSOLE_PLUGIN_IMAGE_REPO=${CONSOLE_PLUGIN_IMAGE_REPO:="ghcr.io/openshift-pipeline/console-plugin"}
CONSOLE_PLUGIN_IMAGE_TAG=${CONSOLE_PLUGIN_IMAGE_TAG:="latest"}
CONSOLE_PLUGIN_IMAGE=${CONSOLE_PLUGIN_IMAGE_REPO}:${CONSOLE_PLUGIN_IMAGE_TAG}

echo "Building the Console Plugin Image: ${CONSOLE_PLUGIN_IMAGE}"

# Prefer podman if installed. Otherwise, fall back to docker 
if [ -x "$(command -v podman)" ]; then 
    podman build -t "${CONSOLE_PLUGIN_IMAGE}" .
    podman push "${CONSOLE_PLUGIN_IMAGE}"

    echo "Pushed ${CONSOLE_PLUGIN_IMAGE}"
else
    docker build -t "${CONSOLE_PLUGIN_IMAGE}" --push .

    echo "Pushed ${CONSOLE_PLUGIN_IMAGE}"
fi
