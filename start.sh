#!/bin/bash
set -eu -o pipefail
if bash mounthouse/scripts/generate_with_env.sh .env; then
    echo "Successfully generated MountHouse mounts.yml." >&2
else
    echo "Failed to generate MountHouse mounts.yml. Will not continue." >&2
    exit "$?"
fi
docker compose up -d --remove-orphans
