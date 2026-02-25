ARG BUILDER=registry.access.redhat.com/ubi9/nodejs-22
ARG RUNTIME=registry.access.redhat.com/ubi9/nginx-124

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
