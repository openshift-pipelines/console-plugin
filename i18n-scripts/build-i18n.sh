#!/usr/bin/env bash

set -exuo pipefail

FILE_PATTERN="{!(dist|node_modules|.agentready)/**/*.{js,jsx,ts,tsx,json},*.{js,jsx,ts,tsx,json}}"

./node_modules/.bin/i18next "${FILE_PATTERN}" [-oc] -c "./i18next-parser.config.js" -o "locales/\$LOCALE/\$NAMESPACE.json"
