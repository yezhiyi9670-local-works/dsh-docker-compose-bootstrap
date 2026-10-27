import os

from api import API
from .utils import use_mounthouse_perf

def define_mounts(api: API):
    with api.config(service='srv_agent', src='./persist/srv_agent', dst='/home/node', options={'must_exist': False, 'create': True}):
        mounthouse_prefix = os.getenv('PERSIST_MOUNTHOUSE_PREFIX', '')
        if mounthouse_prefix == '':
            persist_mount_env = api.config()  # no-op context
            print('persist: Mount persist data dirs as normal.')
        else:
            persist_mount_env = use_mounthouse_perf(api, mounthouse_prefix)
            print('persist: Mount persist data dirs according to PERSIST_MOUNTHOUSE_PREFIX.')
        with persist_mount_env:
            api.rw_bind(both='.dsh')
            api.rw_bind(both='.pinchtab')
            api.rw_bind(both='.config')
            api.rw_bind(both='.local')
            api.rw_bind(both='.cache')

    if not os.path.exists(
        os.path.join(os.path.dirname(__file__), 'priv-srv_agent-workspace.mount.py')
    ):
        raise FileNotFoundError(
            'Expected a private workspaces DSL file "priv-srv_agent-workspace.mount.py". '
            'See "priv-srv_agent-workspace.mount.py.example" file.'
        )
