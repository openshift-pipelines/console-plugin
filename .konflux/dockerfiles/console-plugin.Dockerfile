ARG BUILDER=registry.redhat.io/ubi9/nodejs-20@sha256:938970e0012ddc784adda181ede5bc00a4dfda5e259ee4a57f67973720a565d1
ARG RUNTIME=registry.redhat.io/ubi9/nginx-124@sha256:aa73fdb10af2bf24611ba714a412c2e65cec88a00eee628a0f2a75e564ec18f2
ARG YARN_PKG

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .

RUN ls -l && \
    ls -l /cachi2/output && \
    ls -l /cachi2/output/deps && \
    ls -l /cachi2/output/deps/npm

RUN npm install -g /cachi2/output/deps/npm/"$YARN_PKG"

# Install dependencies & build
RUN CYPRESS_INSTALL_BINARY=0 yarn install --immutable && \
    yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-main

COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/dist /usr/share/nginx/html
COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/nginx.conf /etc/nginx/nginx.conf

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

LABEL \
      com.redhat.component="openshift-pipelines-console-plugin-rhel9-container" \
      name="openshift-pipelines/pipelines-console-plugin-rhel9" \
      version=$VERSION \
      summary="Red Hat OpenShift Pipelines Console Plugin" \
      maintainer="pipelines-extcomm@redhat.com" \
      description="Red Hat OpenShift Pipelines Console Plugin" \
      io.k8s.display-name="Red Hat OpenShift Pipelines Console Plugin" \
      io.k8s.description="Red Hat OpenShift Pipelines Console Plugin" \
      io.openshift.tags="pipelines,tekton,openshift"
