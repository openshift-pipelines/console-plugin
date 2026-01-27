FROM registry.access.redhat.com/ubi8/nodejs-18:latest AS builder-ui
USER root

ADD . /usr/src/app
WORKDIR /usr/src/app

# Use bundled yarn 4.6.0
RUN corepack enable && corepack prepare yarn@4.6.0 --activate
RUN yarn install --immutable && \
    yarn build

FROM registry.access.redhat.com/ubi8/nginx-124:latest

COPY --from=builder-ui /usr/src/app/dist /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/nginx.conf

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]
