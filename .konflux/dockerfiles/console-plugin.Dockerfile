ARG BUILDER=registry.access.redhat.com/ubi8/nodejs-18:latest
ARG RUNTIME=registry.access.redhat.com/ubi8/nginx-124:latest

FROM $BUILDER AS builder-ui

USER root
# RUN command -v yarn || npm i -g yarn
RUN npm i -g yarn

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
RUN set -e; for f in patches/*.patch; do echo ${f}; [[ -f ${f} ]] || continue; git apply ${f}; done
RUN yarn install --frozen-lockfile && \
    yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-main

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
