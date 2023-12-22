#!/bin/bash

set -e

cd db

if [ ! -d node_modules ]; then
    yarn install
fi

export PGHOST=localhost
export PGPORT=5432

export PGDATABASE=$(oc get -n openshift-pipelines configmap tekton-results-postgres -o 'jsonpath={.data.POSTGRES_DB}')
export PGUSERNAME=$(oc get -n openshift-pipelines secret tekton-results-postgres -o 'jsonpath={.data.POSTGRES_USER}' | base64 -d)
export PGPASSWORD=$(oc get -n openshift-pipelines secret tekton-results-postgres -o 'jsonpath={.data.POSTGRES_PASSWORD}' | base64 -d)

yarn run create-demo-data
