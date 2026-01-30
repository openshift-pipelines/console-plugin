FROM cypress/browsers:node-20.18.0-chrome-130.0.6723.69-1-ff-131.0.3-edge-130.0.2849.52-1

USER root

# Remove old yarn completely and install Yarn 4 via corepack
RUN npm uninstall -g yarn || true && \
    rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg || true && \
    rm -f /usr/bin/yarn /usr/bin/yarnpkg || true && \
    npm install -g corepack && \
    corepack enable

# Set corepack home to a shared location
ENV COREPACK_HOME=/opt/corepack
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Prepare yarn 4 in shared location
RUN mkdir -p $COREPACK_HOME && \
    corepack prepare yarn@4.6.0 --activate && \
    yarn --version

# Set working directory
WORKDIR /app

USER node