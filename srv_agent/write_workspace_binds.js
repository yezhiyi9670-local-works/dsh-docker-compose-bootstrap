'use strict';

const fs = require('fs')
const process = require('process')
// Relative path is relative to `derived` folder.
process.chdir(__dirname + '/derived')

const { addPrivDirs } = require('./priv-workspace_dirs.js')

const tmpfsList = []
const mountList = []

function resolveEnvedPath(path) {
  return path.replace(/\$\{([A-Za-z0-9\-_]+)\}/g, (match, key) => {
    return process.env[key] ?? ''
  })
}
function hostPathExists(hostPath) {
  return fs.existsSync(resolveEnvedPath(hostPath))
}
function addTmpfs(containerPath, opts) {
  if(!containerPath) {
    throw new Error('addTmpfs: Container path must not be empty.')
  }
  if(
    containerPath.indexOf(':') != -1 ||
    (opts && opts.indexOf(':') != -1)
  ) {
    throw new Error('No part can contain `:`, except for Windows host drive letter.')
  }
  if(!containerPath.startsWith('/home/node/')) {
    throw new Error('Container mount path should start with home directory `/home/node`. Offender: ' + containerPath)
  }
  
  tmpfsList.push(
    containerPath +
    (opts ? ':' + opts : '')
  )
}
function addMount(hostPath, containerPath, opts) {
  if(!hostPath || !containerPath) {
    throw new Error('addMount: Host and container path must not be empty.')
  }
  if(
    !(
      hostPath.indexOf(':') == -1 ||
      /[A-Za-z]:[\\/][^:]*/.test(hostPath)
    ) ||
    containerPath.indexOf(':') != -1 ||
    (opts && opts.indexOf(':') != -1)
  ) {
    throw new Error('No part can contain `:`, except for Windows host drive letter.')
  }
  if(!containerPath.startsWith('/home/node/')) {
    throw new Error('Container mount path should start with home directory `/home/node`. Offender: ' + containerPath)
  }
  const resolvedHostPath = resolveEnvedPath(hostPath)
  if(!fs.existsSync(resolvedHostPath)) {
    throw new Error('Host workspace path must be existent. Offender: ' + resolvedHostPath)
  }

  mountList.push(
    hostPath + ':' + containerPath +
    (opts ? ':' + opts : '')
  )
}
function addRoTmpfs(containerPath) {
  addTmpfs(containerPath, 'ro')
}
function addRwTmpfs(containerPath) {
  addTmpfs(containerPath, 'rw')
}
function addRoMount(hostPath, containerPath) {
  addMount(hostPath, containerPath, 'ro')
}
function addRwMount(hostPath, containerPath) {
  addMount(hostPath, containerPath, 'rw')
}
function addRwWithRoGit(hostPath, containerPath) {
  addMount(hostPath, containerPath, 'rw')
  addMount(hostPath + '/.git', containerPath + '/.git', 'ro')
  if(fs.existsSync(resolveEnvedPath(hostPath + '/.git/lfs/tmp'))) {
    addMount(hostPath + '/.git/lfs/tmp', containerPath + '/.git/lfs/tmp', 'rw')
  }
}
function setupConventionalWorkspace(containerWsRoot, hostSharedDocsPath, sharedDocWritable, hostSharedTempPath) {
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
        tmpfs: tmpfsList,
        volumes: mountList
      }
    }
  }, null, '  '))
}

addPrivDirs({ hostPathExists, addRoTmpfs, addRwTmpfs, addRoMount, addRwMount, addRwWithRoGit, setupConventionalWorkspace })
finish()
