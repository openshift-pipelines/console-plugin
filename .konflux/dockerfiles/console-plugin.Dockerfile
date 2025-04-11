ARG BUILDER=registry.redhat.io/ubi8/nodejs-18@sha256:42bb2b88aca3eb231031fad1f193daf8333d6e5ab65af855f173bb0cc0930e86
ARG RUNTIME=registry.redhat.io/ubi8/nginx-124@sha256:6a5792cafa3de88ea00ef17bcaa40a4349cac8ec59e5c438b0b8ad2730e5922d

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
ARG VERSION=console-plugin-1-15.3

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
