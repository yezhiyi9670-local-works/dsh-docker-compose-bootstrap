
FROM node:22-bookworm-slim AS base

RUN npm install --global pnpm

FROM base AS setup

RUN apt-get update

RUN apt-get install -y chromium
RUN apt-get install -y --no-install-recommends fonts-noto-cjk fonts-noto-color-emoji && fc-cache -fv
RUN apt-get install -y locales locales-all
RUN apt-get install -y curl dnsutils
RUN apt-get install -y socat
RUN apt-get install -y ripgrep
RUN apt-get install -y bubblewrap

RUN apt-get install -y git git-lfs

FROM setup AS install

# Bun (for development)
RUN npm install --global bun

# Pinchtab
RUN npm install --global pinchtab@0.15.2

# DSH
RUN npm install --global @deepseek-ai/dsh@0.2.0-rc.2

# Config
RUN git config --global core.autocrlf input
RUN git lfs install

FROM install AS postconfig

# About the NARB_DISABLE_NATIVE_CACHE=1 flag:
#   In 0.1.7, `--expose-internals` no longer skip the loading of `node-addon-require-builtin`.
#   `node-addon-require-builtin` native binary is by default copied into `/tmp` and then executed.
#   Since our `/tmp` may be `noexec`, disable this behavior to prevent startup failure.
#   FIXME: `node-addon-require-builtin` package is currently closed-source without adequate
#          documentation or auditing materials. Re-check when appropriate.
ENV NARB_DISABLE_NATIVE_CACHE=1

RUN mkdir -p /app/source
RUN mkdir -p /app/workdir
WORKDIR /app/workdir
USER node

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV TZ=Europe/London

FROM postconfig AS start

# About in-container proxy:
#   DSH currently hard-rejects `--host 0.0.0.0`
CMD [ \
    "sh", "-c", \
    " \
        dsh --profile web --dump-config; \
        socat TCP-LISTEN:3081,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:3080 & \
        yes | pinchtab server --bind 0.0.0.0 --port 3082  & \
        dsh --profile web --host 127.0.0.1 --port 3080 --no-open $DSH_EXTRA_ARGS \
    " \
]
