#!/bin/bash
set -eu -o pipefail
python mounthouse/scripts/main.py clear && echo "Emptied generated MountHouse mounts.yml."
docker compose down --remove-orphans
