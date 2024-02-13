#!/usr/bin/env bash

set -euo pipefail

# container runtime (podman or docker, defaults: docker) supports only on platform specific image builds
# to build multi arch images, always uses "docker buildx"
export CONTAINER_RUNTIME=${CONTAINER_RUNTIME:-docker}
export SUPPORT_MULTI_ARCH=${SUPPORT_MULTI_ARCH:-false}
export CONSOLE_PLUGIN_IMAGE_REPO=${CONSOLE_PLUGIN_IMAGE_REPO:="ghcr.io/openshift-pipeline/console-plugin"}
export CONSOLE_PLUGIN_IMAGE_TAG=${CONSOLE_PLUGIN_IMAGE_TAG:="latest"}
export CONSOLE_PLUGIN_IMAGE=${CONSOLE_PLUGIN_IMAGE_REPO}:${CONSOLE_PLUGIN_IMAGE_TAG}

echo "Building the Console Plugin Image: ${CONSOLE_PLUGIN_IMAGE}"

# builds multi arch images
if [ "$SUPPORT_MULTI_ARCH" = "true" ]; then
  # performing "yarn install" on multiarch with "docker buildx" takes a lot of time
  # to avoid this, "yarn install" and "yarn build" should be executed outside of docker
  # and only copy the "dist" to different platform/architecture runtime containers
  # WARNING: with this approach, if we use platform naive package may lead to a malfunction
  # however in this project, the code will be executed on a browser,
  # hence assuming no impact on this approach
  yarn install --frozen-lockfile
  yarn build

  docker buildx build --push \
    --progress=plain \
    --platform "linux/amd64,linux/arm64,linux/ppc64le,linux/s390x" \
    --file ./Dockerfile.without_builder \
    --tag ${CONSOLE_PLUGIN_IMAGE} .

else # build platform specific image
  ${CONTAINER_RUNTIME} build --file ./Dockerfile --tag ${CONSOLE_PLUGIN_IMAGE} .
  ${CONTAINER_RUNTIME} push ${CONSOLE_PLUGIN_IMAGE}
fi
