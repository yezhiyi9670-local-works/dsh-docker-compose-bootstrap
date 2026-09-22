#!/bin/sh

set -eu

# 1. Resolve the IP address of host.docker.internal
# getent is available in Debian/Ubuntu-based images and handles /etc/hosts correctly
HOST_IP=$(getent hosts host.docker.internal | awk '{ print $1 }' | head -n 1)

# 2. Fallback if resolution fails (e.g., older Docker versions)
if [ -z "$HOST_IP" ]; then
    echo "ERROR: Could not resolve host.docker.internal. Aborting."
    exit 2
fi

echo "INFO: Resolved host.docker.internal to $HOST_IP"

# 3. Replace the placeholder in the config file
cp /root/squid.conf /etc/squid/squid.conf
sed -i "s/HOST_DOCKER_INTERNAL_IP/$HOST_IP/g" /etc/squid/squid.conf

# 4. Hand off to the original Squid entrypoint (for sameersbn/squid)
exec /sbin/entrypoint.sh
