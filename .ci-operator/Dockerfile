FROM cypress/browsers:node-20.18.0-chrome-130.0.6723.69-1-ff-131.0.3-edge-130.0.2849.52-1
#
# # Enable corepack and install Yarn 4 (corepack is bundled with Node 20)
RUN corepack enable && \
    corepack prepare yarn@4.6.0 --activate && \
    yarn --version