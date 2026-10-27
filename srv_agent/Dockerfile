
FROM docker.io/node:22-bookworm-slim AS base

FROM base AS setup

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    fonts-noto-cjk fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install --no-install-recommends -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install --no-install-recommends -y \
    locales locales-all \
    curl dnsutils \
    socat ripgrep bubblewrap \
    git git-lfs \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install --no-install-recommends -y \
    wget apt-transport-https gnupg unzip \
    && rm -rf /var/lib/apt/lists/*
    
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install --no-install-recommends -y \
    golang-go \
    python-is-python3 \
    python3-venv \
    nano \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

COPY fetch_artifact.sh /tmp/fetch_artifact.sh
RUN chmod +x /tmp/fetch_artifact.sh

# JDK21
RUN --mount=type=cache,target=/tmp/artifact-cache,sharing=locked \
    /tmp/fetch_artifact.sh "https://packages.adoptium.net/artifactory/api/gpg/key/public" /tmp/adoptium_key
RUN cat /tmp/adoptium_key | gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg && \
    echo "deb https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install --no-install-recommends -y temurin-21-jdk && \
    rm -rf /var/lib/apt/lists/*

# ======== apt install ends ========

# Note: DSH needs pnpm
RUN --mount=type=cache,target=/root/.npm \
    npm install --global \
    bun@1.4.3 \
    pnpm@12.14.0 \
    && true

# REA base tools setup
ARG REA_TOOLS=/opt/rea-tools
RUN mkdir -p "${REA_TOOLS}"
RUN python -m venv "${REA_TOOLS}/venv"

# Ghidra (for reverse engineering)
ARG GHIDRA_VERSION=12.1.4
ARG GHIDRA_ZIP=ghidra_12.1.4_PUBLIC_20260921.zip
ARG GHIDRA_SHA256=ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db
RUN --mount=type=cache,target=/tmp/artifact-cache,sharing=locked \
    /tmp/fetch_artifact.sh \
    "https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/${GHIDRA_ZIP}" \
    /tmp/ghidra.zip \
    "${GHIDRA_SHA256}"
RUN \
    unzip -q /tmp/ghidra.zip -d /tmp/ghidra \
    && mv "/tmp/ghidra/ghidra_${GHIDRA_VERSION}_PUBLIC" "${REA_TOOLS}/ghidra" \
    && rm -rf /tmp/ghidra \
    && chmod +x "${REA_TOOLS}/ghidra/support/analyzeHeadless" \
    && find "${REA_TOOLS}/ghidra" -name decompile -type f -exec chmod +x {} + \
    && test -f "${REA_TOOLS}/ghidra/Ghidra/application.properties"
ENV GHIDRA_INSTALL_DIR="${REA_TOOLS}/ghidra"

# Some heavy npm packages
RUN --mount=type=cache,target=/root/.npm \
    npm install --global \
    pinchtab@0.15.2 \
    rea-agents@6.7.0 \
    && true

# JADX (for reverse engineering)
ARG JADX_MCP_VERSION=0.7.1
ARG JADX_MCP_SHA256=6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75
RUN --mount=type=cache,target=/tmp/artifact-cache,sharing=locked \
    /tmp/fetch_artifact.sh \
    "https://github.com/1013503897/jadx-headless-mcp/releases/download/v${JADX_MCP_VERSION}/jadx-headless-mcp-${JADX_MCP_VERSION}-all.jar" \
    /tmp/jadx-headless-mcp.jar \
    "${JADX_MCP_SHA256}"
RUN \
    mkdir -p "${REA_TOOLS}/jadx" \
    && mv /tmp/jadx-headless-mcp.jar "${REA_TOOLS}/jadx/jadx-headless-mcp.jar" \
    && chmod 0755 "${REA_TOOLS}/jadx/jadx-headless-mcp.jar"
ENV REA_JADX_MCP_JAR="${REA_TOOLS}/jadx/jadx-headless-mcp.jar"

# apktool (for reverse engineering)
ARG APKTOOL_VERSION=3.0.3
ARG APKTOOL_SHA256=dbf930b076c6b9be08d57c449cacefc3bdd6b71ebd59b3066fc0e1f5b14f9423
RUN --mount=type=cache,target=/tmp/artifact-cache,sharing=locked \
    /tmp/fetch_artifact.sh \
    "https://github.com/iBotPeaches/Apktool/releases/download/v${APKTOOL_VERSION}/apktool_${APKTOOL_VERSION}.jar" \
    /tmp/apktool.jar \
    "${APKTOOL_SHA256}"
RUN \
    mkdir -p "${REA_TOOLS}/apktool" \
    && mv /tmp/apktool.jar "${REA_TOOLS}/apktool/apktool.jar" \
    && chmod 0755 "${REA_TOOLS}/apktool/apktool.jar" \
    && printf '#!/bin/bash\njava -jar "%s/apktool/apktool.jar" "$@"\nexit $?\n' "${REA_TOOLS}" >"${REA_TOOLS}/apktool/apktool" \
    && chmod 0755 "${REA_TOOLS}/apktool/apktool"
ENV REA_APKTOOL_COMMAND="${REA_TOOLS}/apktool/apktool"

# binwalk (for reverse engineering)
ARG BINWALK_VERSION=2.1.0
RUN --mount=type=cache,target=/root/.cache/pip \
    "${REA_TOOLS}/venv/bin/python" -m pip install "binwalk==${BINWALK_VERSION}"
ENV REA_BINWALK_COMMAND="${REA_TOOLS}/venv/bin/unblob"

# unblob (for reverse engineering)
ARG UNBLOB_VERSION=26.6.4
RUN --mount=type=cache,target=/root/.cache/pip \
    "${REA_TOOLS}/venv/bin/python" -m pip install "unblob==${UNBLOB_VERSION}"
ENV REA_UNBLOB_COMMAND="${REA_TOOLS}/venv/bin/unblob"

RUN fc-cache -fv

FROM setup AS install

RUN mkdir -p /app/source
RUN mkdir -p /app/workdir

# DSH
RUN --mount=type=cache,target=/root/.npm \
    npm install --global \
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
#   PinchTab: `pinchtab mcp --agent-id dsh --server http://127.0.0.1:3082` (to main, activity visible through dashboard)
#             `pinchtab mcp --agent-id dsh --server http://127.0.0.1:9868` (to instance 0, more stable)
CMD [ \
    "sh", "-c", \
    " \
        dsh --profile web --dump-config >/dev/null; \
        \
        socat TCP-LISTEN:3083,fork,reuseaddr TCP4:127.0.0.1:3082 & \
        yes | pinchtab server --bind 127.0.0.1 --port 3082 & \
        \
        socat TCP-LISTEN:3081,fork,reuseaddr TCP4:127.0.0.1:3080 & \
        dsh --profile web --host 127.0.0.1 --port 3080 --no-open $DSH_EXTRA_ARGS \
    " \
]
