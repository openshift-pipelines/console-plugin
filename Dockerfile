FROM registry.access.redhat.com/ubi8/nodejs-16:latest AS build
USER root
RUN command -v yarn || npm i -g yarn

ADD . /usr/src/app
WORKDIR /usr/src/app
RUN yarn install && yarn build

FROM registry.access.redhat.com/ubi8/nginx-120:latest

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/nginx.conf

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]