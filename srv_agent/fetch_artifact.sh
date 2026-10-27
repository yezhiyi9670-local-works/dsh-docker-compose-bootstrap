#!/bin/bash
# Usage: --mount=type=cache,target=/tmp/artifact-cache,sharing=locked
#        fetch-artifact.sh <url> <dest> [<sha256>]
set -euo pipefail

URL="$1"
DEST="$2"
SHA256="${3:-}"  # No SHA256 = download every time

if [[ ! -z "$SHA256" ]]; then
    CACHE_DIR="/tmp/artifact-cache"
    CACHE_FILE="${CACHE_DIR}/$(basename "$URL")--${SHA256}"
    mkdir -p "$CACHE_DIR"

    if [[ -f "$CACHE_FILE" ]] && echo "${SHA256}  ${CACHE_FILE}" | sha256sum -c - >/dev/null 2>&1; then
        echo "[cache hit] ${URL}"
    else
        echo "[cache miss] ${URL}"
        curl -fsSL -o "${CACHE_FILE}.tmp" "$URL"
        echo "${SHA256}  ${CACHE_FILE}.tmp" | sha256sum -c -
        mv "${CACHE_FILE}.tmp" "$CACHE_FILE"
    fi

    cp "$CACHE_FILE" "$DEST"
else
    # Direct download, no caching stuff at all
    curl -fsSL -o "$DEST" "$URL"
fi
