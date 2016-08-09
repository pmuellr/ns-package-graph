ns-package-graph - visualize packages used in an N|Solid runtime
================================================================================

![](images/Dillinger-slice.png)

`ns-package-graph` is a command-line tool to generate a graphical
representation of the packages being used in an N|Solid runtime.

usage
================================================================================

    ns-package-graph [options] [app or instance id]

When run with no arguments, displays some help and a list of running N|Solid
application names, and their instance ids.

When you pass an appplication name or instance id as parameter, a matching
instance will be sent the `nsolid-cli package_info` command, to capture
information on the process's packages and modules.  That information is used to
generate a [GraphViz][] [dot][] formatted graph diagram of package dependencies
in the running program.  That output is then passed to the awesome [Viz.js][]
library to convert into SVG, which is then written to stdout.

    $ ns-package-graph Dillinger

    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
     "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <!-- Generated by graphviz version 2.38.0 (20140413.2041)
     -->
    ...

    $ ns-package-graph Dillinger > ~/tmp/Dillinger.svg

The package nodes in the graph output are annotated with color depending on
duplicate package status.  For duplicate copies of the exact same package name
and version, those nodes are colored red - they should have been de-duped.  For
duplicate copies of the exact same package name but different versions, those
nodes are colored yellow.

For example, here's the output from an old version of [Dillinger][]:
[Dillinger.svg](https://pmuellr.github.io/ns-package-graph/images/Dillinger.svg)
or
[Dillinger.png](https://pmuellr.github.io/ns-package-graph/images/Dillinger.png)

![PNG image of packages in the Dillinger app](images/Dillinger.png)

_Note that the packages for Dillinger were installed using npm version 2.
Using npm version 3 provides better de-duping support than version 2._

Clicking on the link to the SVG file above should open the graph in your
browser, allowing you to zoom in to see the node names / versions.

To generate the image in a format other than SVG, use the `--format dot`
option, and then use a [Graphviz][] tool to convert to the format of your
choice.  Eg:

    $ ns-package-graph --format dot Dillinger > Dillinger.dot
    $ dot -T png -O Dillinger.dot   # generates Dillinger.dot.png

[GraphViz]: http://www.graphviz.org/
[dot]: http://www.graphviz.org/pdf/dotguide.pdf
[Viz.js]: http://mdaines.github.io/viz.js/
[Dillinger]: http://dillinger.io/


options
================================================================================

    -v --version  print the current version
    -h --help     print the help text
    -g --group    one of: "package", "version", "path";  default: "package"
    -f --format   one of: "svg", "dot", "data-url";      default: "svg"
    -c --child    one of: "dep", "parent";               default: "dep"

The `--group` option changes the grouping of the nodes to show:

* `package` - one node for each unique package, any version, any path loaded
* `version` - one node for each unique package / version, any path loaded
* `path` - node for each unique package / version / path loaded

The number of nodes drawn increases with each group option, respectively.

The `--format` option determines the output:

* `dot` - generate the Graphviz dot file
* `svg` - generate an SVG file from the Graphviz dot file data
* `data-url` - generate a data URL for the SVG image

The `--child` option determines what children nodes are:

* `dep` - children are the dependencies of the package
* `parent` - children are packages that depend on the package


install
================================================================================

To install the `ns-package-graph` utility globally, run:

    npm install -g https://github.com/pmuellr/ns-package-graph.git

Note that you will to have N|Solid installed and running.  Specifically, this
utility will make calls into `nsolid-cli` to get information from the same
hub as your N|Solid runtime processes.

For more information on installing N|Solid, see:

* https://docs.nodesource.com/nsolid/1.4/docs/quickstart


trouble shooting
================================================================================

The following sort of message will be displayed if the `nsolid-cli` command is
not installed.  Refer to the N|Solid installation instructions above.

    $ ns-package-graph

    error running `nsolid-cli info`: Command failed: nsolid-cli  info
    /bin/sh: nsolid-cli: command not found

For other `nsolid-cli` related errors, see the help information for that
command, by running:

    $ nsolid-cli --help

Eg, if you aren't running the N|Solid hub on the default ports, you can override
the defaults by creating a `~/.nsolid-clirc` file.


contributing
================================================================================

See the documents [CONTRIBUTING.md](CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
