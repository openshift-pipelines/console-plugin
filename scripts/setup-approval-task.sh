#!/bin/bash
set -euo pipefail

# === CONFIG ===
HTPASSWD_FILE="my-htpasswd-file"
SECRET_NAME="htpasswd-secret"
NAMESPACE="openshift-config"
GROUP_NAME_1="test-group-1"
GROUP_NAME_2="test-group-2"
GROUP_NAME_3="test-group-3"
GROUP_NAME_4="test-group-4"
PIPELINE_NAMESPACE="osp-ui"

# Users (username:password)
USERS=(
  "approver-user-1:TestABC579"
  "approver-user-2:TestABC579"
  "tester1:TestABC579"
  "tester2:TestABC579"
  "approver-user-3:TestABC579"
  "approver-user-4:TestABC579"
  "tester3:TestABC579"
  "tester4:TestABC579"
  "approver-user-5:TestABC579"
  "approver-user-6:TestABC579"
  "tester5:TestABC579"
  "tester6:TestABC579"
)
CLUSTER_API="https://api.chat-bot-u89nz-hq4jr8.crt-mce-aws.devcluster.openshift.com:6443"

echo "[INFO] === STEP 1: Create htpasswd file with first user ==="
first_user="${USERS[0]}"
username=$(echo "$first_user" | cut -d: -f1)
password=$(echo "$first_user" | cut -d: -f2)
htpasswd -c -B -b "$HTPASSWD_FILE" "$username" "$password"

echo "[INFO] === STEP 2: Add remaining users ==="
for entry in "${USERS[@]:1}"; do
  username=$(echo "$entry" | cut -d: -f1)
  password=$(echo "$entry" | cut -d: -f2)
  htpasswd -B -b "$HTPASSWD_FILE" "$username" "$password"
done

echo "[INFO] === STEP 3: Create/update secret $SECRET_NAME ==="
oc delete secret $SECRET_NAME -n $NAMESPACE --ignore-not-found
oc create secret generic $SECRET_NAME --from-file=htpasswd=$HTPASSWD_FILE -n $NAMESPACE

echo "[INFO] === STEP 4: Configure OAuth with HTPasswd provider ==="

# Check if this is a managed cluster by trying to modify OAuth spec
echo "[INFO] Checking if OAuth can be modified..."
if ! oc patch oauth cluster --type='merge' -p='{"spec":{"identityProviders":[]}}' 2>/dev/null; then
  echo "[WARNING] This appears to be a managed OpenShift cluster."
  echo "[WARNING] OAuth configuration must be done through the HostedCluster object."
  echo "[INFO] Please ask your cluster administrator to add the HTPasswd provider."
  echo "[INFO] Alternatively, you can use existing cluster users for testing."
  echo ""
  echo "[INFO] Required OAuth configuration:"
  echo "identityProviders:"
  echo "- name: my_htpasswd_provider"
  echo "  mappingMethod: claim"
  echo "  type: HTPasswd"
  echo "  htpasswd:"
  echo "    fileData:"
  echo "      name: $SECRET_NAME"
  echo ""
  read -p "Do you want to continue with existing users? (y/n): " continue_choice
  if [[ "$continue_choice" != "y" && "$continue_choice" != "Y" ]]; then
    echo "[INFO] Exiting. Please configure OAuth through your cluster administrator."
    exit 0
  fi
  echo "[INFO] Continuing with existing cluster authentication..."
else
  # OAuth can be modified - proceed with normal setup
  echo "[SUCCESS] OAuth can be modified - proceeding with HTPasswd setup"
  
  # Check if identityProviders array exists, if not it was just created
  if ! oc get oauth cluster -o jsonpath='{.spec.identityProviders}' | grep -q "\["; then
    echo "[INFO] Creating identityProviders array..."
    oc patch oauth cluster --type='merge' -p='{"spec":{"identityProviders":[]}}'
  fi

  # Add the HTPasswd provider
  echo "[INFO] Adding HTPasswd provider..."
  oc patch oauth cluster --type='json' -p="[
    {
      \"op\": \"add\",
      \"path\": \"/spec/identityProviders/-\",
      \"value\": {
        \"name\": \"my_htpasswd_provider\",
        \"mappingMethod\": \"claim\",
        \"type\": \"HTPasswd\",
        \"htpasswd\": {\"fileData\": {\"name\": \"$SECRET_NAME\"}}
      }
    }
  ]"

  if [ $? -eq 0 ]; then
    echo "[SUCCESS] OAuth provider configured successfully"
  else
    echo "[ERROR] Failed to configure OAuth provider"
    exit 1
  fi
fi

echo "[INFO] === STEP 5: Wait for OAuth configuration to take effect ==="

# Skip OAuth wait if we're using existing users in managed cluster
if [[ "${continue_choice:-}" == "y" || "${continue_choice:-}" == "Y" ]]; then
  echo "[INFO] Skipping OAuth restart wait - using existing cluster authentication"
else
  echo "[INFO] Waiting for OAuth pods to restart..."
  sleep 10

  # Wait for oauth-openshift pods to restart
  echo "[INFO] Checking OAuth pod status..."
  oc wait --for=condition=Ready pod -l app=oauth-openshift -n openshift-authentication --timeout=300s

  echo "[INFO] Waiting additional 60 seconds for OAuth changes to fully propagate..."
  sleep 60

  # Verify OAuth configuration
  echo "[INFO] Verifying OAuth configuration..."
  if oc get oauth cluster -o jsonpath='{.spec.identityProviders[*].name}' | grep -q "my_htpasswd_provider"; then
    echo "[SUCCESS] OAuth provider is configured"
  else
    echo "[ERROR] OAuth provider not found in configuration"
    exit 1
  fi
fi

echo "[INFO] === STEP 6: Create group $GROUP_NAME_1 and add users ==="
oc delete group $GROUP_NAME_1 --ignore-not-found
oc adm groups new $GROUP_NAME_1 approver-user-2 tester1 tester2
oc delete group $GROUP_NAME_2 --ignore-not-found
oc adm groups new $GROUP_NAME_2 approver-user-3 tester3 tester4
oc delete group $GROUP_NAME_3 --ignore-not-found
oc adm groups new $GROUP_NAME_3 approver-user-5 tester5 tester6
oc delete group $GROUP_NAME_4 --ignore-not-found
oc adm groups new $GROUP_NAME_4 

echo "[INFO] === STEP 7: Assign namespace-scoped roles (NOT cluster-admin) ==="
for entry in "${USERS[@]}"; do
  username=$(echo "$entry" | cut -d: -f1)
  oc adm policy add-role-to-user edit "$username" -n $PIPELINE_NAMESPACE || true
done
oc adm policy add-role-to-group view $GROUP_NAME_1 -n $PIPELINE_NAMESPACE || true
oc adm policy add-role-to-group edit $GROUP_NAME_2 -n $PIPELINE_NAMESPACE || true
oc adm policy add-role-to-group view $GROUP_NAME_3 -n $PIPELINE_NAMESPACE || true
oc adm policy add-role-to-group view $GROUP_NAME_4 -n $PIPELINE_NAMESPACE || true

echo "[INFO] === STEP 8: Test user authentication ==="

# Skip authentication test if we're using existing users in managed cluster
if [[ "${continue_choice:-}" == "y" || "${continue_choice:-}" == "Y" ]]; then
  echo "[INFO] Skipping authentication test - using existing cluster users"
  echo "[INFO] Please ensure the users in the USERS array exist in your cluster"
else
  echo "[INFO] Testing authentication for each user..."
  login_success=true

  for entry in "${USERS[@]}"; do
    username=$(echo "$entry" | cut -d: -f1)
    password=$(echo "$entry" | cut -d: -f2)
    echo "[INFO] Testing login for $username ..."
    
    if oc login "$CLUSTER_API" -u "$username" -p "$password" --insecure-skip-tls-verify; then
      echo "[SUCCESS] $username logged in successfully"
    else
      echo "[ERROR] Failed to log in $username"
      login_success=false
    fi
  done

  if [ "$login_success" = false ]; then
    echo "[ERROR] Some users failed to authenticate. Please check OAuth configuration."
    echo "[INFO] You may need to wait longer for OAuth changes to take effect."
    exit 1
  fi

  echo "[SUCCESS] All users authenticated successfully"
fi

echo "[INFO] === STEP 9: Create Pipeline with Inline ApprovalTask ==="
cat <<EOF | oc apply -f -
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: approval-pipeline-test-1
  namespace: $PIPELINE_NAMESPACE
spec:
  tasks:
    - name: pre-check
      taskSpec:
        steps:
          - name: echo
            image: registry.access.redhat.com/ubi8/ubi-minimal
            script: |
              #!/bin/sh
              echo "Pre-check done."

    - name: approval
      taskRef:
        apiVersion: openshift-pipelines.org/v1alpha1
        kind: ApprovalTask
      params:
        - name: approvers
          value:
            - group:test-group-1
            - approver-user-1
            - approver-user-4
        - name: numberOfApprovalsRequired
          value: "2"
        - name: description
          value: "Requires 2 approvals from specified users/groups. Review and approve. Login as one of the approvers to approve. Click something else to reject."
      runAfter:
        - pre-check

    - name: post-check
      runAfter:
        - approval
      taskSpec:
        steps:
          - name: echo
            image: registry.access.redhat.com/ubi8/ubi-minimal
            script: |
              #!/bin/sh
              echo "Pipeline completed after approvals."
EOF

echo "[SUCCESS] Pipeline with inline ApprovalTask created successfully!"
