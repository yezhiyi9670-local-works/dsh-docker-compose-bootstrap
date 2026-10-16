'use strict';

const fs = require('fs')
const process = require('process')
// Relative path is relative to `derived` folder.
process.chdir(__dirname + '/derived')

const { addPrivDirs } = require('./priv-workspace_dirs.js')

const volumesList = []

function resolveEnvedPath(path) {
  return path.replace(/\$\{([A-Za-z0-9\-_]+)\}/g, (match, key) => {
    return process.env[key] ?? ''
  })
}
function hostPathExists(hostPath) {
  return fs.existsSync(resolveEnvedPath(hostPath))
}
function addTmpfs(containerPath, extras) {
  if(!containerPath) {
    throw new Error('addTmpfs: Container path must not be empty.')
  }
  if(!containerPath.startsWith('/home/node/')) {
    throw new Error('Container mount path should start with home directory `/home/node`. Offender: ' + containerPath)
  }
  
  volumesList.push({
    type: 'tmpfs',
    target: containerPath,
    ...extras
  })
}
function addMount(hostPath, containerPath, extras) {
  if(!hostPath || !containerPath) {
    throw new Error('addMount: Host and container path must not be empty.')
  }
  if(!containerPath.startsWith('/home/node/')) {
    throw new Error('Container mount path should start with home directory `/home/node`. Offender: ' + containerPath)
  }
  const resolvedHostPath = resolveEnvedPath(hostPath)
  if(!fs.existsSync(resolvedHostPath)) {
    throw new Error('Host workspace path must be existent. Offender: ' + resolvedHostPath)
  }

  volumesList.push({
    type: 'bind',
    source: hostPath,
    target: containerPath,
    ...extras,
    bind: {
      create_host_path: false,
      ...extras['bind']
    }
  })
}
function addRoTmpfs(containerPath) {
  addTmpfs(containerPath, { read_only: true })
}
function addRwTmpfs(containerPath) {
  addTmpfs(containerPath, { read_only: false })
}
function addRoMount(hostPath, containerPath) {
  addMount(hostPath, containerPath, { read_only: true })
}
function addRwMount(hostPath, containerPath) {
  addMount(hostPath, containerPath, { read_only: false })
}
function addRwWithRoGit(hostPath, containerPath) {
  addMount(hostPath, containerPath, { read_only: false })
  addMount(hostPath + '/.git', containerPath + '/.git', { read_only: true })
  if(fs.existsSync(resolveEnvedPath(hostPath + '/.git/lfs/tmp'))) {
    addMount(hostPath + '/.git/lfs/tmp', containerPath + '/.git/lfs/tmp', { read_only: false })
  }
}
function setupConventionalWorkspace(containerWsRoot, hostSharedDocsPath, sharedDocWritable, hostSharedTempPath) {
  // Root as ro tmpfs
  addRoTmpfs(containerWsRoot)
  // AGENTS.md: Relative path is relative to `derived` folder
  addRoMount('../conventional_workspace.AGENTS.md', containerWsRoot + '/AGENTS.md')
  // workspace-resident tmpfs
  addRwTmpfs(containerWsRoot + '/tmpfs')
  // shared_docs
  if(hostSharedDocsPath) {
    if(sharedDocWritable) {
      addRwWithRoGit(hostSharedDocsPath, containerWsRoot + '/shared_docs')
    } else {
      addRoMount(hostSharedDocsPath, containerWsRoot + '/shared_docs')
    }
  }
  // shared_temp
  if(hostSharedTempPath) {
    addRwMount(hostSharedTempPath, containerWsRoot + '/shared_temp')
  }
}
function finish() {
  // Standard JSON is also YML
  fs.writeFileSync(__dirname + '/derived/workspace_binds.yml', JSON.stringify({
    services: {
      srv_agent: {
        volumes: volumesList
      }
    }
  }, null, '  '))
}

addPrivDirs({ hostPathExists, addRoTmpfs, addRwTmpfs, addRoMount, addRwMount, addRwWithRoGit, setupConventionalWorkspace })
finish()
