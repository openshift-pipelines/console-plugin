ARG BUILDER=registry.redhat.io/ubi8/nodejs-18@sha256:0c6e5d4e57defdbb03b32f0c175bcf458d5a8a84cc7fd076910752614569cbbd
ARG RUNTIME=registry.redhat.io/ubi8/nginx-124@sha256:46df158013bc92bc5907e510e763dc618bf04a0d432c1c689f1082f6fac6e8ff

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
RUN npm install -g yarn-1.22.22.tgz
COPY .konflux/yarn.lock .
COPY .konflux/package.json .
RUN set -e; for f in patches/*.patch; do echo ${f}; [[ -f ${f} ]] || continue; git apply ${f}; done
RUN yarn install --offline --frozen-lockfile --ignore-scripts && \
    yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-1.15.3

COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/dist /usr/share/nginx/html
COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/nginx.conf /etc/nginx/nginx.conf

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

LABEL \
      com.redhat.component="openshift-pipelines-console-plugin-rhel8-container" \
      name="openshift-pipelines/pipelines-console-plugin-rhel8" \
      version=$VERSION \
      summary="Red Hat OpenShift Pipelines Console Plugin" \
      maintainer="pipelines-extcomm@redhat.com" \
      description="Red Hat OpenShift Pipelines Console Plugin" \
      io.k8s.display-name="Red Hat OpenShift Pipelines Console Plugin" \
      io.k8s.description="Red Hat OpenShift Pipelines Console Plugin" \
      io.openshift.tags="pipelines,tekton,openshift"
