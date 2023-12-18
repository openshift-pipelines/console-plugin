#!/bin/bash

set -e

oc rsh -n openshift-pipelines statefulset/tekton-results-postgres \
   psql --dbname=tekton-results
