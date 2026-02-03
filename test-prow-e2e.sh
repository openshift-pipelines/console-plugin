#!/usr/bin/env bash

set -exuo pipefail

# Enable Corepack for Yarn 4
corepack enable && corepack prepare yarn@4.6.0 --activate

ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}
SCREENSHOTS_DIR=gui_test_screenshots
INSTALLER_DIR=${INSTALLER_DIR:=${ARTIFACT_DIR}/installer}

function copyArtifacts {
  if [ -d "$ARTIFACT_DIR" ] && [ -d "$SCREENSHOTS_DIR" ]; then
    if [[ -z "$(ls -A -- "$SCREENSHOTS_DIR")" ]]; then
      echo "No artifacts were copied."
    else
      echo "Copying artifacts from $(pwd)..."
      cp -r "$SCREENSHOTS_DIR" "${ARTIFACT_DIR}/gui_test_screenshots"
    fi
  fi
}

trap copyArtifacts EXIT


# don't log kubeadmin-password
set +x
BRIDGE_KUBEADMIN_PASSWORD="$(cat "${KUBEADMIN_PASSWORD_FILE:-${INSTALLER_DIR}/auth/kubeadmin-password}")"
export BRIDGE_KUBEADMIN_PASSWORD
set -x
BRIDGE_BASE_ADDRESS="$(oc get consoles.config.openshift.io cluster -o jsonpath='{.status.consoleURL}')"
export BRIDGE_BASE_ADDRESS

if [ ! -d node_modules ]; then
  yarn install
fi

while getopts s:h:l:n: flag
do
  case "${flag}" in
    s) spec=${OPTARG};;
    h) headless=${OPTARG};;
    n) nightly=${OPTARG};;
  esac
done

if [ $# -eq 0 ]; then
    echo "Runs Cypress tests in Test Runner or headless mode"
    echo "Usage: test-cypress [-s] <filemask> [-h true] [-n true/false]"
    echo "  '-s <specmask>' is a file mask for spec test files, such as 'tests/pipelines/*'."
    echo "  '-h true' runs Cypress in headless mode. When omitted, launches Cypress Test Runner"
    echo "  '-n true' runs the 'nightly' suite, all specs from selected packages in headless mode"
    echo "Examples:"
    echo "  test-prow-e2e.sh                                       // displays this help text"
    echo "  test-prow-e2e.sh -h false                              // opens Cypress Test Runner"
    echo "  test-prow-e2e.sh -h true                               // runs packages in headless mode"
    echo "  test-prow-e2e.sh -n true                               // runs the whole nightly suite"
    yarn run test-cypress-headless
    trap EXIT
    exit;
fi

if [ -n "${nightly-}" ]; then
  # do not fail fast, let all suites run
  set +e
  err=0
  trap 'err=1' ERR

  yarn run test-cypress-nightly

  exit $err;
fi

if [ -n !"${headless-}" ]; then
  yarn run test-cypress
  exit;
fi

if [ -n "${headless-}" ]; then
  yarn run test-cypress-headless
  exit;
fi

yarn_script="test-cypress"

if [ -n "${nightly-}" ]; then
  yarn_script="$yarn_script-nightly"
elif [ -n !"${headless-}" ]; then
  yarn_script="$yarn_script"
elif [ -n "${headless-}" ]; then
  yarn_script="$yarn_script-headless"
fi

if [ -n "${spec-}" ] && [ -z "${nightly-}"]; then
  yarn_script="$yarn_script --spec '$spec'"
fi

yarn run $yarn_script

# echo "Runs Cypress tests in headless mode"
# yarn run test-cypress-headless
