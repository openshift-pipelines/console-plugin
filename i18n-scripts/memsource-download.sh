#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

# Parse command-line options
while getopts p: flag
do
  case "${flag}" in
      p) PROJECT_ID=${OPTARG};;
      *) echo "usage: $0 [-p]" >&2
         exit 1;;
  esac
done

# Check if PROJECT_ID was provided
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Project ID is required."
  exit 1
fi

echo "Downloading PO files from Project ID \"$PROJECT_ID\""

# Create a temporary download directory
DOWNLOAD_PATH="$(mktemp -d)" || { echo "Failed to create temp folder"; exit 1; }

# Download the PO files for each language from Memsource
for i in "${LANGUAGES[@]}"
do
  COUNTER=0
  CURRENT_PAGE=( $(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number 0 -c uid) )
  
  until [ -z "$CURRENT_PAGE" ]
  do
    ((COUNTER++))
    echo "Downloading page $COUNTER for language $i"
    memsource job download --project-id "$PROJECT_ID" --output-dir "$DOWNLOAD_PATH/$i" --job-id "${CURRENT_PAGE[@]}"
    
    CURRENT_PAGE=$(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number "$COUNTER" -c uid | tr '\n' ' ')
  done
done

TARGET_DIR="./po-files"

mkdir -p "$TARGET_DIR"

for i in "${LANGUAGES[@]}"
do
  if [ -d "$DOWNLOAD_PATH/$i" ]; then
    for file in "$DOWNLOAD_PATH/$i"/*.po; do
      base_name=$(basename "$file")
      mv "$file" "$TARGET_DIR/${base_name%.po}-$i.po"
    done
    echo "Moved and renamed downloaded PO files for language $i to $TARGET_DIR"
  else
    echo "No files downloaded for language $i"
  fi
done

# Cleanup: Remove the temporary download directory
rm -rf "$DOWNLOAD_PATH"

echo "PO files successfully downloaded, renamed, and moved to $TARGET_DIR"

