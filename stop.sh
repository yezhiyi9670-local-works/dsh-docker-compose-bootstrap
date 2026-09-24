#!/bin/bash
set -eu -o pipefail
echo "{}" >srv_agent/derived/workspace_binds.yml
docker compose down --remove-orphans
