#!/usr/bin/env bash

set -e

# This script assumes that you are connected to an OpenShift cluster and have the Pipelines Operator installed

echo "Installing the Pipelines Operator ... "

# Install the Pipelines Operator from subscription
cat << EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  labels:
    operators.coreos.com/openshift-pipelines-operator-rh.openshift-operators: ""
  name: openshift-pipelines-operator-rh
  namespace: openshift-operators
spec:
  channel: latest
  config:
    env:
      - name: IMAGE_RESULTS_API
        value: quay.io/avinkuma/api-b1b7ffa9ba32f7c3020c3b68830b30a8@sha256:e1b184582f9c42fa5493edab03a76ae3adc61359217728028bf11502e144dfd2
  installPlanApproval: Automatic
  name: openshift-pipelines-operator-rh
  source: custom-operators
  sourceNamespace: openshift-marketplace
  startingCSV: openshift-pipelines-operator-rh.v1.13.0
EOF

sleep 120

echo "Installing Tekton Results ... " 
# Install result

openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=tekton-results-api-service.openshift-pipelines.svc.cluster.local" -addext "subjectAltName = DNS:tekton-results-api-service.openshift-pipelines.svc.cluster.local"

oc create secret tls -n openshift-pipelines tekton-results-tls --cert=cert.pem --key=key.pem

oc create secret generic tekton-results-postgres --namespace=openshift-pipelines --from-literal=POSTGRES_USER=result --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 20)

cat << EOF | oc apply -n openshift-pipelines -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tekton-logs
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
EOF

cat << EOF | oc apply -n openshift-pipelines -f -
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonResult
metadata:
  name: result
spec:
  targetNamespace: openshift-pipelines
  logging_pvc_name: tekton-logs
  logs_api: true
  log_level: debug
  db_port: 5432
  db_host: tekton-results-postgres-service.openshift-pipelines.svc.cluster.local
  logs_path: /logs
  logs_type: File
  logs_buffer_size: 32768
  auth_disable: true
  tls_hostname_override: tekton-results-api-service.openshift-pipelines.svc.cluster.local
  db_enable_auto_migration: true
  server_port: 8080
  prometheus_port: 9090
EOF

oc create route -n openshift-pipelines passthrough tekton-results-api-service --service=tekton-results-api-service --port=8080 

sleep 20

echo "Installation done"