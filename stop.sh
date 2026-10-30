#!/bin/bash
set -eu -o pipefail
docker compose -f compose.yml down --remove-orphans
