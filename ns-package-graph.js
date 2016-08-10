#!/usr/bin/env node

'use strict'

const yargs = require('yargs')

const pkgJSON = require('./package.json')
const server = require('./lib/server')
const generator = require('./lib/generator')

const GroupValues = ['package', 'version', 'path']
const Formats = ['svg', 'html', 'dot', 'data-url']
const Childrens = ['dep', 'parent']

const argv = yargs
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('g', 'group')
  .alias('f', 'format')
  .alias('c', 'child')
  .alias('s', 'server').number('s')
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
  child: argv.child || Childrens[0],
  server: argv.server
}

if (GroupValues.indexOf(opts.group) === -1) {
  console.error(`invalid group option, expecting one of: '${GroupValues.join('\', \'')}'`)
  process.exit(1)
}

if (Formats.indexOf(opts.format) === -1) {
  console.error(`invalid format option, expecting one of: '${Formats.join('\', \'')}'`)
  process.exit(1)
}

main()

// Main processing here (mainly so we can return!)
function main () {
  if (argv.server) {
    server.start(opts)
    return
  }

  generator.generate(appArg, opts, (err, doc) => {
    if (err) {
      console.error(err.stack)
      process.exit(1)
    }

    if (doc != null) console.log(doc)
  })
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
  console.error('  -v --version      print the current version')
  console.error('  -h --help         print the help text')
  console.error('  -g --group        group by: "package", "version", "path"')
  console.error('  -f --format       output format: "svg", "dot", "html", "data-url"')
  console.error('  -c --child        child nodes: "dep", "parent"')
  console.error('  -s --server PORT  run server on specified port')
  console.error('')
  console.error('defaults:')
  console.error('  --group    package')
  console.error('  --format   svg')
  console.error('  --child    dep')
  console.error('  --server   (no default port, must be passed as argument)')
  console.error('')
  console.error('for more information, see: https://github.com/pmuellr/ns-package-graph')
}
