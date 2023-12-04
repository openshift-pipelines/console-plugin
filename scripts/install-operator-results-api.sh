#!/usr/bin/env bash

set -e

# This script assumes that you are connected to an OpenShift cluster 
# You can provide the operator version while running the script like so -
# ./install-operator-results-api.sh 1.13.1

# Check if an pipeline operator version is provided
if [ $# -eq 0 ]; then
    # No version provided, use default value
    operator_version="v1.13.0"    
else
    # version provided, use it as the value
    operator_version="$1"
fi

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
        value: quay.io/avinkuma/api-b1b7ffa9ba32f7c3020c3b68830b30a8:latest
  installPlanApproval: Automatic
  name: openshift-pipelines-operator-rh
  source: redhat-operators
  sourceNamespace: openshift-marketplace
  startingCSV: openshift-pipelines-operator-rh.${operator_version}
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