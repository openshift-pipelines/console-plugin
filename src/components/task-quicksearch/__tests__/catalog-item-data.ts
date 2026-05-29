import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { TaskKind } from '../../../types';

export enum CatalogItemTypes {
  ECOSYSTEM_TASK = 'clusterResolverTask',
  ARTIFACTHUB_TASK = 'ArtifactHubTask',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum sampleVersions {
  VERSION_01 = '0.1',
  VERSION_02 = '0.2',
}
type SampleTasks = {
  [key in CatalogItemTypes]?: TaskKind | Record<string, any>;
};

export const sampleTasks: SampleTasks = {
  [CatalogItemTypes.ECOSYSTEM_TASK]: {
    kind: 'Task',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      annotations: {
        'tekton.dev/categories': 'CLI',
        'tekton.dev/displayName': 'ansible tower cli',
        'tekton.dev/pipelines.minVersion': '0.12.1',
        'tekton.dev/tags': 'ansible, cli',
      },
      resourceVersion: '425457',
      name: 'ansible-tower-cli',
      uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
      creationTimestamp: '2021-08-12T07:02:14Z',
      generation: 1,
      namespace: 'karthik',
      labels: {
        'app.kubernetes.io/version': '0.1',
      },
    },
    spec: {
      description:
        'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
      params: [
        {
          default: 'false',
          description: 'Disable tower ssl verification',
          name: 'SSLVERIFY',
          type: 'string',
        },
        {
          default: ['--help'],
          description: 'The tower-cli commands to tun',
          name: 'ARGS',
          type: 'array',
        },
        {
          default: '',
          description: 'The Ansible Tower host',
          name: 'HOST',
          type: 'string',
        },
        {
          default: 'tower-creds',
          description: 'The Ansible Tower secret with credentials',
          name: 'tower-secret',
          type: 'string',
        },
      ],
      steps: [
        {
          args: [
            'echo -e "verify_ssl = $(params.SSLVERIFY)\\nverbose = true\\nhost = $(params.HOST)\\nusername = $USER\\npassword = $PASS" > ~/.tower_cli.cfg\nchmod 600 ~/.tower_cli.cfg\necho "Generated tower_cli.cfg file"\necho "-----------------------------"\nls -lah ~/ | grep tower_cli\necho "-----------------------------"',
          ],
          command: ['/bin/sh', '-c'],
          env: [],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'config',
          resources: {},
        },
        {
          args: ['$(params.ARGS)'],
          command: ['/usr/bin/tower-cli'],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'tower-cli',
          resources: {},
        },
      ],
    },
  },
  [CatalogItemTypes.ARTIFACTHUB_TASK]: {
    task: {
      package_id: '2a9bd40c-aad0-4d80-b6de-1dc234457ff8',
      name: 'ansible-runner',
      description: 'Task to run Ansible playbooks using Ansible Runner',
      version: '0.1',
      display_name: 'Ansible Runner',
      repository: {
        url: 'https://github.com/tektoncd/catalog/task',
        kind: 7,
        name: 'tekton-task-ansible-runner',
        official: false,
        display_name: 'Ansible Runner',
        repository_id: 'abc-123',
        organization_name: 'tektoncd',
        organization_display_name: 'Tekton',
      },
    },
    source: 'ArtifactHub',
  },
};

export const sampleTaskCatalogItem: CatalogItem = {
  uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
  type: 'Red Hat',
  name: 'ansible-tower-cli',
  description:
    'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
  provider: 'Red Hat',
  tags: ['ansible', 'cli'],
  creationTimestamp: '2021-08-12T07:02:14Z',
  icon: {},
  attributes: {
    installed: '0.1',
    versions: [
      {
        id: '0.1',
        version: '0.1',
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: sampleTasks[CatalogItemTypes.ECOSYSTEM_TASK],
};

export const sampleArtifactHubCatalogItem: CatalogItem = {
  uid: '1',
  type: 'Community',
  name: 'ansible-runner',
  description: 'Task to run Ansible playbooks using Ansible Runner',
  provider: 'ArtifactHub',
  tags: ['cli'],
  icon: {
    class: 'build',
  },
  attributes: {
    installed: '',
    versions: [
      {
        version: '0.1',
        contains_security_update: false,
        prerelease: false,
        ts: 1627301708,
      },
      {
        version: '0.2',
        contains_security_update: false,
        prerelease: false,
        ts: 1627301808,
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: sampleTasks[CatalogItemTypes.ARTIFACTHUB_TASK],
};

export const sampleTaskWithMultipleVersions = {
  [sampleVersions.VERSION_01]: `---
  apiVersion: tekton.dev/v1beta1
  kind: Task
  metadata:
    name: openshift-client
    labels:
      app.kubernetes.io/version: "0.1"
    annotations:
      tekton.dev/categories: Openshift
      tekton.dev/pipelines.minVersion: "0.12.1"
      tekton.dev/tags: cli
      tekton.dev/displayName: "openshift client"
      tekton.dev/platforms: "linux/amd64"
  spec:
    description: >-
      This task runs commands against the cluster where the task run is
      being executed.

      OpenShift is a Kubernetes distribution from Red Hat which provides oc,
      the OpenShift CLI that complements kubectl for simplifying deployment
      and configuration applications on OpenShift.

    params:
    - name: SCRIPT
      description: The OpenShift CLI arguments to run
      type: string
      default: "oc $@"
    - name: ARGS
      description: The OpenShift CLI arguments to run
      type: array
      default:
      - "help"
    - name: VERSION
      description: The OpenShift Version to use
      type: string
      default: "4.6"
    resources:
      inputs:
        - name: source
          type: git
          optional: true
    steps:
      - name: oc
        image: quay.io/openshift/origin-cli:$(params.VERSION)
        script: "$(params.SCRIPT)"
        args:
          - "$(params.ARGS)"`,
  [sampleVersions.VERSION_02]: `---
          apiVersion: tekton.dev/v1beta1
          kind: Task
          metadata:
            name: openshift-client
            labels:
              app.kubernetes.io/version: "0.2"
            annotations:
              tekton.dev/categories: Openshift
              tekton.dev/pipelines.minVersion: "0.17.0"
              tekton.dev/tags: cli
              tekton.dev/displayName: "openshift client"
              tekton.dev/platforms: "linux/amd64"
          spec:
            workspaces:
              - name: manifest-dir
                optional: true
                description: >-
                  The workspace which contains kubernetes manifests which we want to apply on the cluster.
              - name: kubeconfig-dir
                optional: true
                description: >-
                  The workspace which contains the the kubeconfig file if in case we want to run the oc command on another cluster.
            description: >-
              This task runs commands against the cluster provided by user
              and if not provided then where the Task is being executed.

              OpenShift is a Kubernetes distribution from Red Hat which provides oc,
              the OpenShift CLI that complements kubectl for simplifying deployment
              and configuration applications on OpenShift.

            params:
              - name: SCRIPT
                description: The OpenShift CLI arguments to run
                type: string
                default: "oc help"
              - name: VERSION
                description: The OpenShift Version to use
                type: string
                default: "4.7"
            steps:
              - name: oc
                image: quay.io/openshift/origin-cli:$(params.VERSION)
                script: |
                  #!/usr/bin/env bash

                  [[ "$(workspaces.manifest-dir.bound)" == "true" ]] && \
                  cd $(workspaces.manifest-dir.path)

                  [[ "$(workspaces.kubeconfig-dir.bound)" == "true" ]] && \
                  [[ -f $(workspaces.kubeconfig-dir.path)/kubeconfig ]] && \
                  export KUBECONFIG=$(workspaces.kubeconfig-dir.path)/kubeconfig

                  $(params.SCRIPT)`,
};

export const sampleCatalogItems: CatalogItem[] = [
  sampleTaskCatalogItem,
  sampleArtifactHubCatalogItem,
];
