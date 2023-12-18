#!/bin/bash

set -e

oc logs -n openshift-pipelines deployment/tekton-results-api --tail=10 -f
