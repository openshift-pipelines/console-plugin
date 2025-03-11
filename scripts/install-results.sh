echo "Installing Tekton Results ... " 
# Install result

oc create secret generic tekton-results-postgres   --namespace=openshift-pipelines   --from-literal=POSTGRES_USER=result   --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 20)

cat << EOF | oc apply -n openshift-pipelines -f -
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonResult
metadata:
  name: result
spec:
  targetNamespace: openshift-pipelines
  loki_stack_name: logging-loki
  loki_stack_namespace: openshift-logging
  auth_disable: true
EOF

oc create route -n openshift-pipelines passthrough tekton-results-api-service --service=tekton-results-api-service --port=8080 

sleep 20

echo "Installation done"