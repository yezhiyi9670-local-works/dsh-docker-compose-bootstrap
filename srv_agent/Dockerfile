
FROM node:22-bookworm-slim AS base

RUN --mount=type=cache,target=/root/.npm,id=npm-node22 \
    npm install --global pnpm@12.14.0

FROM base AS setup

RUN --mount=type=cache,target=/var/cache/apt,id=apt-debian-bookworm,sharing=locked \
    apt-get update && apt-get install -y \
    fonts-noto-cjk fonts-noto-color-emoji \
    chromium \
    && true

RUN --mount=type=cache,target=/var/cache/apt,id=apt-debian-bookworm,sharing=locked \
    apt-get update && apt-get install -y \
    locales locales-all \
    curl dnsutils \
    socat ripgrep bubblewrap \
    git git-lfs \
    && true

RUN --mount=type=cache,target=/var/cache/apt,id=apt-debian-bookworm,sharing=locked \
    apt-get update && apt-get install -y \
    golang-go \
    python-is-python3 \
    && true

# Prevent any installation after this point
RUN rm -rf /var/lib/apt/lists/*

RUN fc-cache -fv

FROM setup AS install

RUN mkdir -p /app/source
RUN mkdir -p /app/workdir

RUN --mount=type=cache,target=/root/.npm,id=npm-node22 \
    npm install --global \
    bun@1.4.3 \
    pinchtab@0.15.2 \
    @deepseek-ai/dsh@0.2.1-rc.2 \
    && true

# Config
RUN git lfs install
RUN su -c "git config --global core.autocrlf input" node

FROM install AS postconfig

# About the NARB_DISABLE_NATIVE_CACHE=1 flag:
#   In 0.1.7, `--expose-internals` no longer skip the loading of `node-addon-require-builtin`.
#   `node-addon-require-builtin` native binary is by default copied into `/tmp` and then executed.
#   Since our `/tmp` may be `noexec`, disable this behavior to prevent startup failure.
#   FIXME: `node-addon-require-builtin` package is currently closed-source without adequate
#          documentation or auditing materials. Re-check when appropriate.
ENV NARB_DISABLE_NATIVE_CACHE=1

WORKDIR /app/workdir
USER node

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV TZ=Europe/London

FROM postconfig AS start

# About in-container proxy:
#   DSH currently hard-rejects `--host 0.0.0.0`
# MCP:
#   PinchTab: `pinchtab mcp --agent-id dsh --server http://127.0.0.1:3082` (to main)
#             `pinchtab mcp --agent-id dsh --server http://127.0.0.1:9868` (to instance 0, more stable)
CMD [ \
    "sh", "-c", \
    " \
        dsh --profile web --dump-config; \
        \
        socat TCP-LISTEN:3083,fork,reuseaddr TCP4:127.0.0.1:3082 & \
        yes | pinchtab server --bind 127.0.0.1 --port 3082 & \
        \
        socat TCP-LISTEN:3081,fork,reuseaddr TCP4:127.0.0.1:3080 & \
        dsh --profile web --host 127.0.0.1 --port 3080 --no-open $DSH_EXTRA_ARGS \
    " \
]
