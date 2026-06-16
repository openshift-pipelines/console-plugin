#!/usr/bin/env bash
#
# Install Tekton Pruner and configure namespace-level pruning.
#
# Usage:
#   ./scripts/install-tekton-pruner.sh
#   USER_NS=my-team PRUNER_VERSION=v0.4.0 ./scripts/install-tekton-pruner.sh
#
# Requires: oc or kubectl, cluster-admin (for SCC on OpenShift)
#
set -euo pipefail

PRUNER_VERSION="${PRUNER_VERSION:-v0.4.0}"
PRUNER_NS="${PRUNER_NS:-tekton-pipelines}"
USER_NS="${USER_NS:-osp-ui}"
RELEASE_URL="https://infra.tekton.dev/tekton-releases/pruner/previous/${PRUNER_VERSION}/release.yaml"

# Namespace-level retention defaults (override via env)
TTL_SECONDS="${TTL_SECONDS:-60}"
SUCCESSFUL_HISTORY_LIMIT="${SUCCESSFUL_HISTORY_LIMIT:-5}"
FAILED_HISTORY_LIMIT="${FAILED_HISTORY_LIMIT:-5}"
GLOBAL_TTL_SECONDS="${GLOBAL_TTL_SECONDS:-3600}"

if command -v oc >/dev/null 2>&1; then
  KCMD=oc
  OPENSHIFT=true
elif command -v kubectl >/dev/null 2>&1; then
  KCMD=kubectl
  OPENSHIFT=false
else
  echo "error: oc or kubectl is required" >&2
  exit 1
fi

log() { echo "==> $*"; }

wait_for_deployment() {
  local ns=$1 name=$2 timeout=${3:-180}
  log "Waiting for deployment/${name} in ${ns} (timeout ${timeout}s)..."
  if ! "$KCMD" rollout status "deployment/${name}" -n "$ns" --timeout="${timeout}s"; then
    echo "error: deployment/${name} did not become ready" >&2
    "$KCMD" get pods -n "$ns" -l "app.kubernetes.io/part-of=tekton-pruner" 2>/dev/null || true
    "$KCMD" get events -n "$ns" --field-selector type=Warning --sort-by=.metadata.creationTimestamp 2>/dev/null | tail -5 || true
    exit 1
  fi
}

patch_openshift_deployments() {
  log "Applying OpenShift SCC and security context patches..."
  "$KCMD" adm policy add-scc-to-user pipelines-scc \
    -z tekton-pruner-controller -n "$PRUNER_NS" 2>/dev/null || true

  for dep in tekton-pruner-controller tekton-pruner-webhook; do
    if "$KCMD" get deployment "$dep" -n "$PRUNER_NS" >/dev/null 2>&1; then
      # Remove hardcoded runAsUser:65532; OpenShift assigns UID from namespace range.
      "$KCMD" patch deployment "$dep" -n "$PRUNER_NS" --type=json \
        -p='[{"op":"remove","path":"/spec/template/spec/containers/0/securityContext/runAsUser"}]' \
        2>/dev/null || true
    fi
  done

  "$KCMD" rollout restart deployment/tekton-pruner-controller deployment/tekton-pruner-webhook \
    -n "$PRUNER_NS" 2>/dev/null || true
}

log "Installing Tekton Pruner ${PRUNER_VERSION}..."

log "Creating namespaces..."
"$KCMD" create namespace "$PRUNER_NS" --dry-run=client -o yaml | "$KCMD" apply -f -
"$KCMD" create namespace "$USER_NS" --dry-run=client -o yaml | "$KCMD" apply -f -

log "Applying pruner release manifest..."
# First apply may fail on ConfigMaps if the validating webhook is not ready yet.
set +e
"$KCMD" apply -f "$RELEASE_URL"
apply_rc=$?
set -e
if [[ $apply_rc -ne 0 ]]; then
  log "Initial apply returned errors (expected if webhook/configmaps failed); continuing..."
fi

if [[ "$OPENSHIFT" == "true" ]]; then
  patch_openshift_deployments
fi

wait_for_deployment "$PRUNER_NS" tekton-pruner-webhook 180
wait_for_deployment "$PRUNER_NS" tekton-pruner-controller 180

log "Re-applying release to create validated ConfigMaps..."
"$KCMD" apply -f "$RELEASE_URL"

if [[ "$OPENSHIFT" == "true" ]]; then
  # Re-apply may restore runAsUser; patch again if pods fail to schedule.
  patch_openshift_deployments
  wait_for_deployment "$PRUNER_NS" tekton-pruner-webhook 120
  wait_for_deployment "$PRUNER_NS" tekton-pruner-controller 120
fi

log "Configuring global pruner policy (namespace-level enforcement)..."
"$KCMD" apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: tekton-pruner-default-spec
  namespace: ${PRUNER_NS}
  labels:
    app.kubernetes.io/part-of: tekton-pruner
    pruner.tekton.dev/config-type: global
data:
  global-config: |
    enforcedConfigLevel: namespace
    ttlSecondsAfterFinished: ${GLOBAL_TTL_SECONDS}
    successfulHistoryLimit: 10
    failedHistoryLimit: 10
EOF

log "Configuring namespace pruner policy for '${USER_NS}'..."
"$KCMD" apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: tekton-pruner-namespace-spec
  namespace: ${USER_NS}
  labels:
    app.kubernetes.io/part-of: tekton-pruner
    pruner.tekton.dev/config-type: namespace
data:
  ns-config: |
    ttlSecondsAfterFinished: ${TTL_SECONDS}
    successfulHistoryLimit: ${SUCCESSFUL_HISTORY_LIMIT}
    failedHistoryLimit: ${FAILED_HISTORY_LIMIT}
EOF

log "Installation complete."
echo
echo "Pruner controller namespace : ${PRUNER_NS}"
echo "Namespace config target     : ${USER_NS}"
echo
echo "Verify:"
echo "  ${KCMD} get pods -n ${PRUNER_NS}"
echo "  ${KCMD} get cm tekton-pruner-default-spec -n ${PRUNER_NS} -o jsonpath='{.data.global-config}'"
echo "  ${KCMD} get cm tekton-pruner-namespace-spec -n ${USER_NS} -o jsonpath='{.data.ns-config}'"
echo "  ${KCMD} logs -n ${PRUNER_NS} -l app.kubernetes.io/part-of=tekton-pruner --tail=20"
