#!/bin/bash
set -eu -o pipefail
if node --env-file=.env srv_agent/write_workspace_binds.js; then
    echo "Successfully generated workspace_binds.yml." >&2
else
    echo "Failed to generate workspace_binds.yml. Will not continue." >&2
    exit "$?"
fi
docker compose up -d --build --remove-orphans
