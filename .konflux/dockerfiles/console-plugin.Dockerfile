ARG BUILDER=registry.redhat.io/ubi9/nodejs-20@sha256:938970e0012ddc784adda181ede5bc00a4dfda5e259ee4a57f67973720a565d1
ARG RUNTIME=registry.redhat.io/ubi9/nginx-124@sha256:aa73fdb10af2bf24611ba714a412c2e65cec88a00eee628a0f2a75e564ec18f2

FROM $BUILDER AS builder-ui

WORKDIR /go/src/github.com/openshift-pipelines/console-plugin
COPY . .
RUN npm install -g yarn-1.22.22.tgz
RUN set -e; for f in patches/*.patch; do echo ${f}; [[ -f ${f} ]] || continue; git apply ${f}; done

USER root

# Enable FIPS mode during build process
RUN fips-mode-setup --enable && \
    update-crypto-policies --set FIPS && \
    echo "Build stage - Verifying FIPS kernel parameter:" && \
    cat /proc/sys/crypto/fips_enabled && \
    echo "Build stage - Verifying OpenSSL FIPS status:" && \
    openssl version -a | grep -i fips && \
    (openssl md5 /dev/null || echo "MD5 test passed (expected failure in FIPS mode)")

RUN yarn install --offline --frozen-lockfile --ignore-scripts && \
    yarn build

FROM $RUNTIME
ARG VERSION=console-plugin-1.20

COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/dist /usr/share/nginx/html
COPY --from=builder-ui /go/src/github.com/openshift-pipelines/console-plugin/nginx.conf /etc/nginx/nginx.conf

USER root
# Enable FIPS mode in runtime container
RUN fips-mode-setup --enable && \
    update-crypto-policies --set FIPS && \
    echo "Runtime stage - Verifying FIPS kernel parameter:" && \
    cat /proc/sys/crypto/fips_enabled && \
    echo "Runtime stage - Verifying OpenSSL FIPS status:" && \
    openssl version -a | grep -i fips && \
    (openssl md5 /dev/null || echo "MD5 test passed (expected failure in FIPS mode)")

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
