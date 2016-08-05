'use strict'

exports.createGraph = createGraph

const path = require('path')

function createGraph (pkgInfoArray) {
  return new Graph(pkgInfoArray)
}

// Models a set of linked packages.
class Graph {
  constructor (pkgInfoArray) {
    // create the Pkg objects
    const pkgArray = pkgInfoArray.map((pkgInfo) => new Pkg(pkgInfo))

    // add the to the map
    this.pkgs = new Map()
    for (let pkg of pkgArray) {
      this.pkgs.set(pkg.path, pkg)
    }

    // resolve dependencies and parents
    for (let pkg of pkgArray) {
      pkg.deps = pkg.depPaths.map((path) => this.pkgs.get(path))

      for (let depPkg of pkg.deps) {
        depPkg.rents.push(pkg)
      }
    }
  }

  // Return all the packages in the graph as an array.
  getPackages () {
    return Array.from(this.pkgs.values())
  }

  // Dump the graph to the console.
  dump () {
    for (let pkg of this.getPackages()) {
      console.log(`${pkg}`)
      console.log(`   deps:  ${pkg.deps.map((p) => `${p}`).join(', ')}`)
      console.log(`   rents: ${pkg.rents.map((p) => `${p}`).join(', ')}`)
      console.log()
    }
  }
}

// Models a package.
class Pkg {
  constructor (pkgInfo) {
    this.path = pkgInfo.path
    this.name = pkgInfo.name
    this.version = pkgInfo.version
    this.depPaths = pkgInfo.dependencies.map((dep) => path.resolve(this.path, dep))
    this.deps = []
    this.rents = []
  }

  toString () {
    return `Package{${this.name} @ ${this.version}}`
  }
}
