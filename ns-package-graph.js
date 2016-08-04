#!/usr/bin/env node

'use strict'

const path = require('path')

const viz = require('viz.js')
const nsolidCLI = require('./lib/nsolid-cli')

// Run `nsolid-cli info` to get list of processes
nsolidCLI.run('info', function (err, infos) {
  if (err) {
    console.error('error running `nsolid-cli info`:', err.message)
    process.exit(1)
  }

  let id
  let app = process.argv[2]

  if (app == null) {
    console.log('specify either an app name or id as an argument')
    console.log('')
    console.log('for more information, see: https://github.com/pmuellr/ns-package-graph')
    console.log('')
    printAppsAndIds(infos)
    process.exit(1)
  }

  for (let info of infos) {
    if (app === info.app) {
      id = info.id
      break
    }

    if (app === info.id) {
      id = info.id
      app = info.app
      break
    }
  }

  if (id == null) {
    console.log(`specified argument is neither an app nor an id: '${app}'`)
    console.log('')
    printAppsAndIds(infos)
    process.exit(1)
  }

  getPackageInfo(app, id)
})

// Get the package information for a specific app.
function getPackageInfo (app, id) {
  nsolidCLI.run('package_info', app, id, function (err, packageInfo) {
    if (err) {
      console.error('error running `nsolid-cli info`', err)
      process.exit(1)
    }

    processPackageInfo(app, id, packageInfo)
  })
}

// Process the package info.
function processPackageInfo (app, id, packageInfo) {
  if (!packageInfo.packages) throw new Error('expecting packages property')

  // get the package directories
  const pkgDirs = packageInfo.packages.map(function (pkg) { return pkg.path })

  // create a map of package dir : package, and name/version counts
  const pkgMap = {}
  const pkgCount = {}
  packageInfo.packages.forEach(function (pkg) {
    pkgMap[pkg.path] = pkg

    const nameVersion = pkg.name + '@' + pkg.version
    if (pkgCount[nameVersion] == null) {
      pkgCount[nameVersion] = 1
    } else {
      pkgCount[nameVersion]++
    }
  })

  // turn all the dependencies into refs to their packages
  packageInfo.packages.forEach(function (pkg) {
    pkg.dependencies = pkg.dependencies.map(function (dep) {
      const depPath = path.resolve(pkg.path, dep)
      return pkgMap[depPath]
    })
  })

  const dotLines = []

  dotLines.push('digraph packages {')
  dotLines.push('node [style=filled];')

  pkgDirs.forEach(function (pkgDir) {
    const pkg = pkgMap[pkgDir]
    const count = pkgCount[pkg.name + '@' + pkg.version]

    if (count > 1) {
      dotLines.push('"' + getNodeName(pkg) + '" [color="#FFA0A0"];')
    }

    pkg.dependencies.forEach(function (dep) {
      dotLines.push('"' + getNodeName(pkg) + '" -> "' + getNodeName(dep) + '";')
    })
  })

  dotLines.push('}')

  console.log(viz(dotLines.join('\n')))

  // Return a nice node name for a package/version.
  function getNodeName (pkg) {
    const name = pkg.name.replace(/-/g, '-\\n') + '\\n' + pkg.version
    const count = pkgCount[pkg.name + '@' + pkg.version]

    if (count === 1) return name
    return name + '\\n' + count + ' copies'
  }
}

function printAppsAndIds (infos) {
  console.log('apps:')
  const apps = new Set(infos.map((info) => info.app))
  for (let app of apps) {
    console.log(`   ${app}`)
  }

  console.log('')
  console.log('ids:')
  for (let info of infos) {
    console.log(`   ${info.id}  (app: ${info.app})`)
  }
}
