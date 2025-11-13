ARG BUILDER=registry.redhat.io/ubi9/nodejs-20@sha256:de36f9d79d9105adc636fac7786649d0a0ece9475ea312a8675752218845468e
ARG RUNTIME=registry.redhat.io/ubi9/nginx-124@sha256:cd49f0b20c71ade4babf4212869f850645d9f151591fe031d48739d213edd7d4

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
RUN npm install -g yarn-1.22.22.tgz
RUN set -e; for f in patches/*.patch; do echo ${f}; [[ -f ${f} ]] || continue; git apply ${f}; done
COPY .konflux/yarn.lock .
RUN yarn install --offline --frozen-lockfile --ignore-scripts && \
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
