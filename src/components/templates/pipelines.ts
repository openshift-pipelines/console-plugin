export const newPipelineTemplate = `
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: new-pipeline
spec:
  params:
    - name: paramName
      type: string
    - name: IMAGE
      type: string
  workspaces:
    - name: source-workspace
  tasks:
    - name: build-app
      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: s2i-java
          - name: namespace
            value: openshift-pipelines
      workspaces:
        - name: source
          workspace: source-workspace
      params:
        - name: IMAGE
          value: $(params.IMAGE)
`;

export const newPipelineResourceTemplate = `
apiVersion: tekton.dev/v1
kind: PipelineResource
metadata:
  name: nginx-ex-git-resource
spec:
  type: git
  params:
    - name: url
      value: https://github.com/sclorg/nginx-ex.git
    - name: revision
      value: master
`;

export const newTaskTemplate = `
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: example-task
spec:
  params:
    - name: appName
      type: string
  steps:
  - image: registry.redhat.io/ubi7/ubi-minimal
    command:
    - /bin/bash
    - '-c'
    - echo
    - $(inputs.params.appName)
`;

export const newTaskRunTemplate = `
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  name: example-taskrun
spec:
  taskSpec:
    steps:
      - name: echo
        image: registry.redhat.io/ubi7/ubi-minimal
        command:
        - /bin/bash
        - '-c'
        - echo
        - "Hello OpenShift"
`;
