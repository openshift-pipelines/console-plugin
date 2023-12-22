#!/bin/bash

set -e

oc port-forward -n openshift-pipelines statefulset/tekton-results-postgres '5432:5432'
