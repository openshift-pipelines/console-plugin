#!/usr/bin/env bash

set -euo pipefail

# https://ci-operator-configresolver-ui-ci.apps.ci.l2s4.p1.openshiftapps.com/help#env
OPENSHIFT_CI=${OPENSHIFT_CI:=false}
ARTIFACT_DIR=${ARTIFACT_DIR:=/tmp/artifacts}

# Enable Corepack for Yarn 4
corepack enable && corepack prepare yarn@4.6.0 --activate

if [ ! -d node_modules ]; then
  yarn install
fi

# Check for outdated yarn.lock file
if [[ -n "$(git status --porcelain -- yarn.lock)" ]]; then
  echo "Outdated yarn.lock file, commit changes to fix!"
  git --no-pager diff
  exit 1
fi

# Check for outdated i18n files
yarn i18n
GIT_STATUS="$(git status --short --untracked-files -- locales)"
if [ -n "$GIT_STATUS" ]; then
  echo "i18n files are not up to date. Run 'yarn i18n' then commit changes."
  git --no-pager diff
  exit 1
fi

yarn run lint

if [ "$OPENSHIFT_CI" = true ]; then
  JEST_SUITE_NAME="Pipeline Console Plugin Unit Tests" JEST_JUNIT_OUTPUT_DIR="$ARTIFACT_DIR" yarn run test --ci --maxWorkers=2 --reporters=default --reporters=jest-junit
else
  yarn run test
fi
