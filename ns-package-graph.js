#!/usr/bin/env node

'use strict'

const viz = require('viz.js')
const yargs = require('yargs')

const pkgJSON = require('./package.json')
const nsolidCLI = require('./lib/nsolid-cli')
const Pkg = require('./lib/pkg')

const GroupValues = ['package', 'version', 'path']
const Formats = ['svg', 'dot', 'data-url']
const Childrens = ['dep', 'parent']

const argv = yargs
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('g', 'group')
  .alias('f', 'format')
  .alias('c', 'child')
  .argv

const appArg = argv._[0]

if (argv.version) {
  console.error(pkgJSON.version)
  process.exit(0)
}

if (argv.help || appArg === '?') {
  printHelp()
  process.exit(0)
}

const opts = {
  group: argv.group || GroupValues[0],
  format: argv.format || Formats[0],
  child: argv.child || Childrens[0]
}

if (GroupValues.indexOf(opts.group) === -1) {
  console.error(`invalid group option, expecting one of: '${GroupValues.join('\', \'')}'`)
  process.exit(1)
}

if (Formats.indexOf(opts.format) === -1) {
  console.error(`invalid format option, expecting one of: '${Formats.join('\', \'')}'`)
  process.exit(1)
}

// console.log(appArg, opts)

// Run `nsolid-cli info` to get list of processes
nsolidCLI.run('info', function (err, infos) {
  if (err) {
    console.error('error running `nsolid-cli info`:', err.message)
    process.exit(1)
  }

  if (appArg == null) {
    printHelp()
    console.error('')
    printAppsAndIds(infos)
    process.exit(1)
  }

  let id
  let app = appArg

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
    console.error(`unknown app or id: ${appArg}`)
    console.error('')
    printAppsAndIds(infos)
    process.exit(1)
  }

  getPackageInfo(app, id, opts)
})

// Get the package information for a specific app.
function getPackageInfo (app, id, opts) {
  nsolidCLI.run('package_info', app, id, function (err, packageInfo) {
    if (err) {
      console.error('error running `nsolid-cli info`', err)
      process.exit(1)
    }

    processPackageInfo(app, id, packageInfo, opts)
  })
}

// Process the package info.
function processPackageInfo (app, id, packageInfo, opts) {
  if (!packageInfo.packages) throw new Error('expecting packages property')

  // create the graph data structure
  const pkgGraph = Pkg.createGraph(packageInfo.packages)

  // collect the packages per grouping option
  let pkgs
  switch (opts.group) {
    case 'package':
      pkgs = pkgGraph.getPackagesByName()
      break
    case 'version':
      pkgs = pkgGraph.getPackagesByVersion()
      break
    case 'path':
      pkgs = pkgGraph.getPackagesByPath()
      break
    default:
      throw new Error(`unknown grouping: ${opts.group}`)
  }

  // start building the Graphviz dot file
  const dotLines = []

  dotLines.push('digraph packages {')
  dotLines.push('    concentrate = true;')
  dotLines.push('    node [')
  dotLines.push('       style = filled,')
  dotLines.push('       color = "#00FF00",')
  dotLines.push('       shape = polygon,')
  dotLines.push('       sides = 6,')
  dotLines.push('       orientation = 30.0,')
  dotLines.push('       penwidth = 2')
  dotLines.push('    ];')
  dotLines.push('    edge [')
  dotLines.push('       color = "#0000FF"')
  dotLines.push('    ];')
  dotLines.push('')

  // write the package dependency connections
  for (let pkg of pkgs) {
    for (let dep of pkg.deps) {
      let from
      let to

      if (opts.child === 'dep') {
        from = pkg
        to = dep
      } else {
        from = dep
        to = pkg
      }

      const tooltip = `${from.name} -> ${to.name}`
      dotLines.push(`    pkg_${from.id} -> pkg_${to.id} [`)
      dotLines.push(`        tooltip = "${tooltip}"`)
      dotLines.push('    ];')
    }
  }
  dotLines.push('')

  // write the package attributes
  for (let pkg of pkgs) {
    const label = `label = "${getPkgLabel(pkg)}"`
    const color = `fillcolor = "#${getPkgColor(pkg)}"`
    const sideColor = `color = "#${getPkgSideColor(pkg)}"`
    const url = `URL = "https://www.npmjs.com/package/${pkg.name}"`
    const tooltip = `tooltip = "${getPkgTooltip(pkg)}"`

    dotLines.push(`    pkg_${pkg.id} [`)
    dotLines.push(`        ${label},`)
    dotLines.push(`        ${color},`)
    dotLines.push(`        ${sideColor},`)
    dotLines.push(`        ${url},`)
    dotLines.push(`        ${tooltip}`)
    dotLines.push('    ];')
  }

  dotLines.push('}')

  const dotFile = dotLines.join('\n')
  if (opts.format === 'dot') {
    console.log(dotFile)
    return
  }

  const svg = viz(dotFile)
  if (opts.format === 'svg') {
    console.log(svg)
    return
  }

  const svgBase64 = new Buffer(svg).toString('base64')
  console.log(`data:image/svg+xml;base64,${svgBase64}`)
}

// Return a tooltip for a package
function getPkgTooltip (pkg) {
  const tooltip = [ pkg.name ]

  tooltip.push(`versions: ${pkg.versions.join(', ')}`)
  tooltip.push('paths:')
  for (let path of pkg.paths) {
    tooltip.push(`    ${path}`)
  }

  // return tooltip.join('\n')
  // return tooltip.join('\r')
  return tooltip.join('&#013;')
}

// Return a color for a package
function getPkgColor (pkg) {
  if (pkg.versionCopies !== 1) return 'FFA0A0'
  if (pkg.nameCopies !== 1) return 'FFFFA0'
  return 'F7FFF7'
}

// Return a color for a package side
function getPkgSideColor (pkg) {
  if (pkg.versionCopies !== 1) return 'FF0000'
  if (pkg.nameCopies !== 1) return '00FF00'
  return '00FF00'
}

// Return a label for a package
function getPkgLabel (pkg) {
  // const name = pkg.name.replace(/-/g, '-\\n') + '\\n'
  const name = splitPkgName(pkg.name)
  const versions = pkg.versions.join('\\n')
  const paths = pkg.versionCopies
  const pathCopies = paths === 1 ? '' : `\\n${paths} copies`

  return `${name}\\n${versions}${pathCopies}`
}

// Split a package name nicely.
function splitPkgName (pkgName) {
  // if name is <= 10 chars, just use it as is
  if (pkgName.length <= 10) return pkgName

  // otherwise, iterate through chars, separating nicely
  const parts = []
  let part = ''

  for (let c of pkgName) {
    part += c

    // if not a separator, continue
    if (['-', '_'].indexOf(c) === -1) continue

    // if the current part length < 6, continue
    if (part.length < 6) continue

    // finish a part, start a new one
    parts.push(part)
    part = ''
  }

  // if there's a hanging part, <= 4 chars, append it to previous
  if (part !== '' && parts.length > 0 && part.length <= 3) {
    parts[parts.length - 1] += part
  } else {
    parts.push(part)
  }

  return parts.join('\\n')
}

// Print the current apps and ids.
function printAppsAndIds (infos) {
  console.error('available apps:')
  const apps = new Set(infos.map((info) => info.app))
  for (let app of apps) {
    console.error(`   ${app}`)
  }

  console.error('')
  console.error('available ids:')
  for (let info of infos) {
    console.error(`   ${info.id}  (app: ${info.app})`)
  }
}

// Print some help.
function printHelp () {
  console.error('Generate an SVG image of the packages used in an N|Solid runtime.')
  console.error('')
  console.error(`usage: ${pkgJSON.name} [options] [app | id]`)
  console.error('')
  console.error('use either an N|Solid app name or N|Solid agent id as an argument')
  console.error('')
  console.error('options:')
  console.error('  -v --version  print the current version')
  console.error('  -h --help     print the help text')
  console.error('  -g --group    group by: "package", "version", "path";  default: "package"')
  console.error('  -f --format   output format: "svg", "dot", "data-url"; default: "svg"')
  console.error('  -c --child    child nodes: "dep", "parent";            default: "dep"')
  console.error('')
  console.error('for more information, see: https://github.com/pmuellr/ns-package-graph')
}
