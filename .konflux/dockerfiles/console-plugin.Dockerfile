ARG BUILDER=registry.redhat.io/ubi9/nodejs-18@sha256:ffbad8210aee178157e7621b5fa43fb85f1ac205246b0d2606bea778549da8c1
ARG RUNTIME=registry.access.redhat.com/ubi9/nginx-124@sha256:8f3028866a8e2d8fafea39b0fc49f523a46ec645d11507c2a04bedf93c79142d

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
RUN npm install -g yarn-1.22.22.tgz
RUN set -e; for f in patches/*.patch; do echo ${f}; [[ -f ${f} ]] || continue; git apply ${f}; done
USER root
RUN yarn install --offline --frozen-lockfile --ignore-scripts && \
    NODE_OPTIONS=--enable-fips yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-1.19

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
