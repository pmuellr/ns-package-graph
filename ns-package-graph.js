#!/usr/bin/env node

'use strict'

const viz = require('viz.js')

const nsolidCLI = require('./lib/nsolid-cli')
const Pkg = require('./lib/pkg')

// Run `nsolid-cli info` to get list of processes
nsolidCLI.run('info', function (err, infos) {
  if (err) {
    console.error('error running `nsolid-cli info`:', err.message)
    process.exit(1)
  }

  let id
  let app = process.argv[2]

  if (app == null) {
    console.error('specify either an app name or id as an argument')
    console.error('')
    console.error('for more information, see: https://github.com/pmuellr/ns-package-graph')
    console.error('')
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
    console.error(`specified argument is neither an app nor an id: '${app}'`)
    console.error('')
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

  // create the graph data structure
  const pkgGraph = Pkg.createGraph(packageInfo.packages)
  // pkgGraph.dump()

  // create a map of package name : copies of that pkg name
  const pkgCount = new Map()

  // create a map of package name/version : copies of that pkg name/version
  const pkgVersCount = new Map()

  for (let pkg of pkgGraph.getPackages()) {
    let count

    // update pkgCount
    count = pkgCount.get(pkg.name) || 0
    count++
    pkgCount.set(pkg.name, count)

    // update pkgVersCount
    const nameVersion = getPkgVersion(pkg)

    count = pkgVersCount.get(nameVersion) || 0
    count++
    pkgVersCount.set(nameVersion, count)
  }

  const dotLines = []

  dotLines.push('digraph packages {')
  dotLines.push('node [style=filled];')

  for (let pkg of pkgGraph.getPackages()) {
    const pkgNum = pkgCount.get(pkg.name)
    const pkgVersNum = pkgVersCount.get(getPkgVersion(pkg))

    if (pkgVersNum > 1) {
      dotLines.push('"' + getNodeName(pkg) + '" [color="#FFA0A0"];')
    } else if (pkgNum > 1) {
      dotLines.push('"' + getNodeName(pkg) + '" [color="#FFFFA0"];')
    }

    for (let dep of pkg.deps) {
      dotLines.push('"' + getNodeName(pkg) + '" -> "' + getNodeName(dep) + '";')
    }
  }

  dotLines.push('}')

  console.log(viz(dotLines.join('\n')))

  // Return name@version of a package.
  function getPkgVersion (pkg) {
    return `${pkg.name}@${pkg.version}`
  }

  // Return a nice node name for a package/version.
  function getNodeName (pkg) {
    const name = pkg.name.replace(/-/g, '-\\n') + '\\n' + pkg.version

    const pkgNum = pkgCount.get(pkg.name)
    const pkgVersNum = pkgVersCount.get(getPkgVersion(pkg))

    const nameBits = [ name ]
    if (pkgNum > 1) nameBits.push(`\\n${pkgNum} pkg copies`)
    if (pkgVersNum > 1) nameBits.push(`\\n${pkgVersNum} pkg@vers copies`)
    return nameBits.join('')
  }
}

function printAppsAndIds (infos) {
  console.error('apps:')
  const apps = new Set(infos.map((info) => info.app))
  for (let app of apps) {
    console.error(`   ${app}`)
  }

  console.error('')
  console.error('ids:')
  for (let info of infos) {
    console.error(`   ${info.id}  (app: ${info.app})`)
  }
}
