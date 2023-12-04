#!/usr/bin/env bash

set -e

# This script assumes that you are connected to an OpenShift cluster and have the Pipelines Operator installed

kubectl apply -f .

tkn pipeline start say-things --showlog

tkn pipeline start say-things-in-order --showlog

tkn pipeline start say-things --showlog

tkn pipeline start say-things-in-order --showlog

tkn pipeline start say-things --showlog

