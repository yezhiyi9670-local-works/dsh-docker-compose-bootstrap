from contextlib import contextmanager
from contextvars import ContextVar
import re
from typing import NotRequired, TypedDict, Unpack
from api import API

def create_to_mounthouse_perf(prefix: str):
    def to_mounthouse_perf(path: str, abspath: str):
        def disk_letter_to_msys(prefix: re.Match):
            return '/' + prefix.group(1).lower() + '/'
        msys_path = re.sub(r'([A-Za-z]):(\\|/|$)', disk_letter_to_msys, abspath).replace("\\", '/')
        return prefix + msys_path
    return to_mounthouse_perf

@contextmanager
def use_mounthouse_perf(api: API, prefix: str):
    '''
    Sets house mapper to to_mounthouse_perf.
    Also set create=True to work around Docker Desktop quirks that prevents container
    from auto-starting on boot.
    '''
    # Mount with the no-coherence performance mounthouse,
    # in order to keep performance acceptable.
    # Set create to True to work around Docker quirks that prevents container
    # from auto-starting on boot.
    with api.config(options={'house_mapper': create_to_mounthouse_perf(prefix), 'create': True}):
        yield

WSL_MOUNT_BASE = r'\\wsl$\docker-desktop\/mnt/host/'
def to_indocker_host_mount(path: str, abspath: str):
    if path.startswith(WSL_MOUNT_BASE):
        return '/mnt/host/' + path[len(WSL_MOUNT_BASE):]
    raise ValueError(
        f'Expected path translated with to_indocker_host_mount to start with '
        f'"{WSL_MOUNT_BASE}". Offender: "{path}".'
    )

@contextmanager
def use_wsl_host_mount(api: API):
    '''
    Sets house mapper to_indocker_host_mount, and
    change source base directory to WSL_MOUNT_BASE.
    '''
    with api.config(src=WSL_MOUNT_BASE, options={'house_mapper': to_indocker_host_mount}):
        yield

class ConventionalConfig(TypedDict):
    shared_docs: NotRequired[str]
    shared_temp: NotRequired[str]
    docs_writable: NotRequired[bool]
c_conventional_config: ContextVar[ConventionalConfig] = ContextVar(
    'conventional_config',
    default={
        'docs_writable': True
    }
)
@contextmanager
def conventional_config(__unused: None = None, /, **kwargs: Unpack[ConventionalConfig]):
    token = c_conventional_config.set({
        **c_conventional_config.get(),
        **kwargs
    })
    try:
        yield
    finally:
        c_conventional_config.reset(token)


def setup_conventional_ws(api: API):
    config = c_conventional_config.get()
    api.ro_tmpfs(dst='')
    api.ro_bind(src='!./srv_agent/conventional_workspace.AGENTS.md', dst='AGENTS.md')
    api.rw_tmpfs(dst='tmpfs')
    shared_docs = config.get('shared_docs', None)
    if shared_docs:
        if config.get('docs_writable', None):
            api.rw_bind_ro_git(src=shared_docs, dst='shared_docs')
        else:
            api.ro_bind(src=shared_docs, dst='shared_docs')
    shared_temp = config.get('shared_temp', None)
    if shared_temp:
        api.rw_bind(src=shared_temp, dst='shared_temp')
