ARG BUILDER=registry.access.redhat.com/ubi9/nodejs-22@sha256:2c3bb588fae7d9d1e5acd1afd77a61cc8cbae2d0d3f85bb7ec03bb3275ba2420
ARG RUNTIME=registry.access.redhat.com/ubi9/nginx-124@sha256:2a819f43952e42003101db5dd6f3a7d9a14ca38cac4b95016f23dcf678e22d2d

# Stage 1: Build UI
FROM $BUILDER AS builder-ui

USER root   

# Enable Corepack and prepare Yarn 4.6
RUN npm install -g corepack && corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy source
ADD . /usr/src/app
WORKDIR /usr/src/app

# Install dependencies & build
RUN yarn install --immutable && \
    yarn build

# Stage 2: Serve with Nginx
FROM $RUNTIME

COPY --from=builder-ui /usr/src/app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf

USER 1001
ENTRYPOINT ["nginx", "-g", "daemon off;"]
