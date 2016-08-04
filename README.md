ns-package-graph - visualize packages used in an N|Solid runtime
================================================================================

![](images/sample-slice.png)

usage
================================================================================

    ns-package-graph [app or instance id]

When run with no arguments, displays a list of running N|Solid applications,
and their instances.

When you pass an app or instance id as parameter, a matching instance will
be sent the `nsolid-cli package_info` command, to capture information on the
process's packages and modules.  That information is used to generate a
[GraphViz][] [dot][] formatted graph diagram of package dependencies in the
running program.  That output is then passed to the awesome [Viz.js][] library
to convert into SVG, which is then written to stdout.

For example, here's the output from an old version of [Dillinger][]:

[images/Dillinger.svg](images/Dillinger.svg)

![SVG image of packages in the Dillinger app](images/Dillinger.svg)

[GraphViz]: http://www.graphviz.org/
[dot]: http://www.graphviz.org/pdf/dotguide.pdf
[Viz.js]: http://mdaines.github.io/viz.js/
[Dillinger]: http://dillinger.io/


install
================================================================================

To install the `ns-package-graph` utility globally, run:

    npm install -g https://github.com/pmuellr/ns-package-graph.git

Note that you will to have N|Solid installed and running.  Specifically, this
utility will make calls into `nsolid-cli` to get information from the same
hub as your N|Solid runtime processes.

For more information on installing the components, see:

* https://docs.nodesource.com/nsolid/1.4/docs/quickstart


trouble shooting
================================================================================

The following sort of message will be displayed if the `nsolid-cli` command is
not installed.  Refer to the installation instructions above.

    $ ns-package-graph

    error running `nsolid-cli info`: Command failed: nsolid-cli  info
    /bin/sh: nsolid-cli: command not found


contributing
================================================================================

See the documents [CONTRIBUTING.md](CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
