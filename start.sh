#!/bin/bash
set -eu -o pipefail
node --env-file=.env srv_agent/write_workspace_binds.js
docker compose up -d --build --remove-orphans
