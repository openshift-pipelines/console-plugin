#!/usr/bin/env bash

set -euo pipefail

ARTIFACT_DIR="${ARTIFACT_DIR:-/tmp/artifacts}"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-${ARTIFACT_DIR}}"
TEST_REPO_DIR="${TEST_REPO_DIR:-/tmp/release-ui-tests}"
TEST_REPO_REF="${RELEASE_UI_TESTS_REF:-release-v4.21}"

mkdir -p "${ARTIFACTS_DIR}"

# The release-ui-tests repository takes care of osp operator and console plugin setup.
# This script only clones the tests, configures credentials, and runs them.
rm -rf "${TEST_REPO_DIR}"
git clone --depth 1 --branch "${TEST_REPO_REF}" \
  https://github.com/openshift-pipelines/release-ui-tests.git \
  "${TEST_REPO_DIR}"
cd "${TEST_REPO_DIR}"

# The generic-claim workflow exposes the kubeadmin password through a file.
# Prefer the explicit CI-provided path and retain the shared-directory fallback.
password_file="${KUBEADMIN_PASSWORD_FILE:-${SHARED_DIR}/kubeadmin-password}"
if [[ ! -s "${password_file}" ]]; then
  echo "ERROR: kubeadmin password file is missing or empty: ${password_file}"
  exit 1
fi

export CONSOLE_URL="$(oc get consoles.config.openshift.io cluster \
  -o jsonpath='{.status.consoleURL}')"
export CONSOLE_USERNAME="kubeadmin"
export CONSOLE_PASSWORD="$(<"${password_file}")"
export ARTIFACTS_DIR
export APP_TIMEOUT="${APP_TIMEOUT:-90000}"
export AUTH_TYPE="direct"
export CAPTURE_SCREENSHOTS="${CAPTURE_SCREENSHOTS:-true}"
export CAPTURE_RECORDINGS="${CAPTURE_RECORDINGS:-true}"

pytest -m sanity -v --tb=short 2>&1 | \
  tee "${ARTIFACTS_DIR}/pytest-output.log"