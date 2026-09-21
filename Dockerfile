
FROM node:22-bookworm-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS setup

RUN mkdir -p /dsh/source
RUN mkdir -p /dsh/workdir
WORKDIR /dsh/workdir

FROM setup AS install

RUN npm install --global @deepseek-ai/dsh@0.1.5-rc.2

FROM install AS extra_utils

RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y socat

FROM extra_utils AS profile_setup

FROM profile_setup AS start

USER node
# Needs in-container proxy: DSH currently hard-rejects `--host 0.0.0.0`
# Needs `--expose-internals`: https://github.com/deepseek-ai/deepseek-harness/discussions/3494
CMD [ \
    "sh", "-c", \
    " \
        socat TCP-LISTEN:3081,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:3080 & \
        node --expose-internals /usr/local/lib/node_modules/@deepseek-ai/dsh/lib/bin.js --profile web --host 127.0.0.1 --port 3080 --no-open \
    " \
]
