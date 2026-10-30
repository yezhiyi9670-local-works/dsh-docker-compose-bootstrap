The files are not automatically sourced by anything. They are example configuration files for you to copy to certain global locations in case you need to troubleshoot certain things.

- [pasta-loopback.conf](./containers.conf.d/pasta-loopback.conf): Forces bridging networks to use the `pasta` driver instead of slirp4netns, and maps loopback interface at 169.254.1.2, which pasta hardcodedly resolve `host.docker.internal` to. \
  This effectively exposes any localhost-bound service on the host to any bridge-network (the default for new containers by default) containers. You need to take security precautions if you earlier assume that localhost-bound services cannot be accessed by containers by default, but this could also be a useful security feature that allows you to easily expose host services to the agent without exposing them to the LAN. \
  You can control which host ports the agent can access in the config files of `srv_outbounds`. \
  Expected location: `.config/containers/containers.conf.d/pasta-loopback.conf`
