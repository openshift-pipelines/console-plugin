ARG BUILDER=registry.redhat.io/ubi8/nodejs-18@sha256:5f2b2247351172b5526248a0188ebec23319713e4b43a8592cf9bdcc7b11c637
ARG RUNTIME=registry.redhat.io/ubi8/nginx-124@sha256:530a44440d0090f0df03b55c13f1e592ae3c9b2faac5180b07a848deb4e9d742

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
#Install Yarn
RUN if [[ -d /cachi2/output/deps/npm/ ]]; then \
      npm install -g /cachi2/output/deps/npm/yarnpkg-cli-dist-4.6.0.tgz; \
      YARN_ENABLE_NETWORK=0; \
    else \
      npm install -g corepack; \
      corepack enable ;\
      corepack prepare yarn@4.6.0 --activate;  \
    fi


# Install dependencies & build
USER root
RUN CYPRESS_INSTALL_BINARY=0 yarn install --immutable && \
    yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-1.17.2

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
      io.openshift.tags="pipelines,tekton,openshift" \
      cpe="cpe:/a:redhat:openshift_pipelines:1.17::el8"
