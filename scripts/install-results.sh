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