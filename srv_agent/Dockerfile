
FROM node:22-bookworm-slim AS base

RUN npm install --global pnpm

FROM base AS setup

RUN apt-get update

RUN apt-get install -y chromium
RUN apt-get install -y --no-install-recommends fonts-noto-cjk fonts-noto-color-emoji && fc-cache -fv

RUN apt-get install -y curl
RUN apt-get install -y socat
RUN apt-get install -y ripgrep
RUN apt-get install -y bubblewrap

RUN apt-get install -y git

FROM setup AS install

# Pinchtab
RUN npm install --global pinchtab@0.15.2

# Using time travel due to 0.1.5-rc.3 version breakage:
# https://github.com/deepseek-ai/deepseek-harness/discussions/7500
RUN npm install --global @deepseek-ai/dsh@0.1.5-rc.2 --before 2026-09-22T00:00:00+00:00

FROM install AS start

RUN mkdir -p /app/source
RUN mkdir -p /app/workdir
WORKDIR /app/workdir
USER node
# Needs in-container proxy: DSH currently hard-rejects `--host 0.0.0.0`
# Needs `--expose-internals`: https://github.com/deepseek-ai/deepseek-harness/discussions/3494
CMD [ \
    "sh", "-c", \
    " \
        dsh --profile web --dump-config; \
        socat TCP-LISTEN:3081,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:3080 & \
        yes | pinchtab server --bind 0.0.0.0 --port 3082  & \
        node --expose-internals /usr/local/lib/node_modules/@deepseek-ai/dsh/lib/bin.js --profile web --host 127.0.0.1 --port 3080 --no-open \
    " \
]
