#!/bin/bash
set -eu -o pipefail
if bash mounthouse/scripts/generate_with_env.sh .env; then
    echo "Successfully generated MountHouse mounts.yml." >&2
else
    echo "Failed to generate MountHouse mounts.yml. Will not continue." >&2
    exit "$?"
fi
CONTAINERS_CONF_OVERRIDE=./containers.conf docker compose up -d --build --remove-orphans
