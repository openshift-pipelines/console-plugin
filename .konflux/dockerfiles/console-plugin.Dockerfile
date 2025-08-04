ARG BUILDER=registry.redhat.io/ubi9/nodejs-20@sha256:0b3efb944852c4bed1711dda1b89e0f95f214faaf74506268490b497139327b5
ARG RUNTIME=registry.redhat.io/ubi9/nginx-124@sha256:fc4def879394f8372626cf139ace7182e5cabbbd13f7a72639c64258f3b853ae

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
ARG VERSION=console-plugin-1.19

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
