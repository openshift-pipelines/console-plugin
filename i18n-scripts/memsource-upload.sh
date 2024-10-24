#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

# Initialize variables
VERSION=""
SPRINT=""

# Parse command-line options
while getopts v:s: flag
do
  case "${flag}" in
      v) VERSION=${OPTARG};;
      s) SPRINT=${OPTARG};;
      *) echo "usage: $0 [-v VERSION] [-s SPRINT]" >&2
         exit 1;;
  esac
done

# Get the current git branch
BRANCH=$(git branch --show-current)

# Display project creation info
echo "Creating project with title \"[Pipelines operator $VERSION] UI Localization - Sprint $SPRINT/Branch $BRANCH\""

# Create the project in Memsource
PROJECT_INFO=$(memsource project create --name "[Pipelines operator $VERSION] UI Localization - Sprint $SPRINT/Branch $BRANCH" --template-id zBOwr4BxYwEq7xlJ37c1F3 -f json)
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.uid')

# Path to the PO file
PO_FILE="i18n-scripts/plugin__pipelines-console-plugin.po"
echo "Current directory: $(pwd)"

# Create jobs for the specified languages using the existing PO file
echo "Creating jobs for the PO file: $PO_FILE"
for i in "${LANGUAGES[@]}"
do
  memsource job create --filenames "$PO_FILE" --target-langs "$i" --project-id "${PROJECT_ID}"
done

echo "Uploaded PO files to Memsource"
