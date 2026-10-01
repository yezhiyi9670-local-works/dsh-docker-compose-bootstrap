const fs = require('fs')
const process = require('process')

const { addPrivDirs } = require('./priv-workspace_dirs.js')

const tmpfsList = []
const mountList = []

function resolveEnvedPath(path) {
  return path.replace(/\$\{([A-Za-z0-9\-_]+)\}/g, (match, key) => {
    return process.env[key] ?? ''
  })
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
    throw new Error('Container mount path should start with home directory `/home/node`. Found: ' + containerPath)
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
    throw new Error('Container mount path should start with home directory `/home/node`. Found: ' + containerPath)
  }
  const resolvedHostPath = resolveEnvedPath(hostPath)
  if(!fs.existsSync(resolvedHostPath)) {
    throw new Error('Host workspace path must be existent. Found: ' + hostPath)
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

addPrivDirs({ addRoTmpfs, addRwTmpfs, addRoMount, addRwMount, addRwWithRoGit })
finish()
