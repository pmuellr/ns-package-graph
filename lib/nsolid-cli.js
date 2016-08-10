'use strict'

const childProcess = require('child_process')

exports.run = run

// Run an nsolid-cli command.
function run (command, app, id, cb) {
  if ((typeof app === 'function') && !id && !cb) {
    cb = app
    app = null
    id = null
  }

  if ((typeof id === 'function') && !cb) {
    cb = id
    id = null
  }

  const options = []

  if (app) options.push('--app ' + app)
  if (id) options.push('--id ' + id)

  command = `nsolid-cli ${options.join(' ')} ${command}`

  const env = JSON.parse(JSON.stringify(process.env))

  // we don't want to run `nsolid-cli` under nsolid ...
  delete env.NSOLID_SOCKET
  delete env.NSOLID_HUB
  delete env.NSOLID_APPNAME

  const execOpts = {
    env: env,
    maxBuffer: 20 * 1000 * 1000
  }

  childProcess.exec(command, execOpts, done)

  function done (err, stdout, stderr) {
    if (err) return cb(err)

    const result = []
    for (let line of stdout.split('\n')) {
      if (line === '') continue

      try {
        line = JSON.parse(line)
      } catch (err) {
        line = JSON.stringify({err: 'invalid JSON', line: line})
      }

      if (app && id) {
        if (line != null) result.push(line)
      } else {
        if (line != null && line.reply != null) result.push(line.reply)
      }
    }

    if (app && id) {
      cb(null, result[0])
    } else {
      cb(null, result)
    }
  }
}

// Run a simple test when used as main module.
if (require.main === module) {
  run('info', (err, out) => console.log(err, out))
}
