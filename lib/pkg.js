'use strict'

exports.createGraph = createGraph

const path = require('path')

function createGraph (pkgInfoArray) {
  return new Graph(pkgInfoArray)
}

// Models a set of linked packages from N|Solid package_info output.
class Graph {
  constructor (pkgInfoArray) {
    this.pkgArray = pkgInfoArray.map((pkgInfo) => new Pkg(pkgInfo))
  }

  getPackagesByName () {
    return this.collectPackageInfo((pkg) => pkg.name)
  }

  getPackagesByVersion () {
    return this.collectPackageInfo((pkg) => pkg.nameVersion)
  }

  getPackagesByPath () {
    return this.collectPackageInfo((pkg) => pkg.path)
  }

  // Collect package info, keyed off specified key.
  collectPackageInfo (keyFn) {
    const resultMap = new Map()
    const pathMap = new Map()

    const nameCounts = new Map()
    const versionCounts = new Map()

    let id = 0

    // collect package information ...
    for (let rawPkg of this.pkgArray) {
      // add/update entry in resultMap
      const key = keyFn(rawPkg)
      let pkg = resultMap.get(key)
      if (pkg == null) {
        pkg = {
          id: id++,
          name: rawPkg.name,
          versions: new Set(),
          paths: new Set(),
          depPaths: new Set(),
          deps: new Set(),
          rents: new Set()
        }
        resultMap.set(key, pkg)
      }

      // increment name and version counts
      incr(nameCounts, rawPkg.name)
      incr(versionCounts, rawPkg.nameVersion)

      // add version, path and depPaths
      pkg.versions.add(rawPkg.version)
      pkg.paths.add(rawPkg.path)

      for (let depPath of rawPkg.depPaths) {
        pkg.depPaths.add(depPath)
      }

      // add entry in pathMap
      pathMap.set(rawPkg.path, pkg)
    }

    // link dependents and parents
    for (let pkg of resultMap.values()) {
      for (let depPath of pkg.depPaths) {
        const depPkg = pathMap.get(depPath)
        pkg.deps.add(depPkg)
        depPkg.rents.add(pkg)
      }
    }

    // flatten
    const result = []
    for (let pkg of resultMap.values()) {
      pkg.versions = Array.from(pkg.versions)
      pkg.paths = Array.from(pkg.paths)
      pkg.deps = Array.from(pkg.deps)
      pkg.rents = Array.from(pkg.rents)
      pkg.nameCopies = nameCounts.get(pkg.name)
      pkg.versionCopies = 0
      for (let version of pkg.versions) {
        pkg.versionCopies = Math.max(
          pkg.versionCopies,
          versionCounts.get(`${pkg.name}@${version}`)
        )
      }

      delete pkg.depPaths

      result.push(pkg)
    }

    return result
  }
}

// Models a package.
class Pkg {
  constructor (pkgInfo) {
    this.path = pkgInfo.path
    this.name = pkgInfo.name
    this.version = pkgInfo.version
    this.nameVersion = `${this.name}@${this.version}`
    this.depPaths = pkgInfo.dependencies.map((dep) => path.resolve(this.path, dep))
  }

  toString () {
    return `Package{${this.name} @ ${this.version}, path: ${this.path}}`
  }
}

function incr (map, key) {
  let val = map.get(key)
  if (val == null) val = 0

  val++
  map.set(key, val)
}
