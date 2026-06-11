#!/bin/bash
set -euo pipefail

COUNT="${1:-20}"
NAMESPACE="${2:-osp-ui}"

if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
  echo "Namespace $NAMESPACE does not exist — creating it..."
  kubectl create namespace "$NAMESPACE"
fi

echo "Creating $COUNT pipeline(s) in namespace $NAMESPACE..."

for i in $(seq 1 "$COUNT"); do
  echo "Creating echo-pipeline-$i..."
  kubectl apply -f - <<EOF
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: echo-pipeline-$i
  namespace: $NAMESPACE
spec:
  description: |
    A sample pipeline that runs three echo tasks sequentially,
    followed by three finally tasks for cleanup or reporting.
  tasks:
    - name: echo-task-1
      taskSpec:
        steps:
          - name: step-1
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Running Task 1 (Pipeline $i)"

    - name: echo-task-2
      runAfter:
        - echo-task-1
      taskSpec:
        steps:
          - name: step-2
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Running Task 2 (Pipeline $i)"

    - name: echo-task-3
      runAfter:
        - echo-task-2
      taskSpec:
        steps:
          - name: step-3
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Running Task 3 (Pipeline $i)"

  finally:
    - name: final-echo-1
      taskSpec:
        steps:
          - name: final-step-1
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Finally Task 1 - cleanup (Pipeline $i)"

    - name: final-echo-2
      taskSpec:
        steps:
          - name: final-step-2
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Finally Task 2 - notify (Pipeline $i)"

    - name: final-echo-3
      taskSpec:
        steps:
          - name: final-step-3
            image: alpine:latest
            script: |
              #!/bin/sh
              echo "Finally Task 3 - wrap-up (Pipeline $i)"
EOF
done

echo "Done — created $COUNT pipeline(s) in namespace $NAMESPACE."

echo "Starting all pipelines in namespace $NAMESPACE..."

for i in $(seq 1 "$COUNT"); do
  echo "Starting echo-pipeline-$i..."
  tkn pipeline start "echo-pipeline-$i" -n "$NAMESPACE"
done

echo "Done — started $COUNT pipeline(s) in namespace $NAMESPACE."
