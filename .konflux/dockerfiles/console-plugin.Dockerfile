ARG BUILDER=registry.redhat.io/ubi8/nodejs-18@sha256:84932815119868d5c48100e5cd764cf00edaaf9aedb9df4726a8cafd899f8a6b
ARG RUNTIME=registry.redhat.io/ubi8/nginx-124@sha256:b02afddd2dd7d754bda1226fe3141f4b934f1e2fab3a1ed1ddc9bd476a8ee3e6

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
