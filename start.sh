#!/bin/bash
set -eu -o pipefail
node --env-file=.env srv_agent/write_workspace_binds.js && echo "Successfully generated workspace_binds.yml."
docker compose up -d --build --remove-orphans
