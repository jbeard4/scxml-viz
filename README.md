
**Note: We have developed a new SCXML visualization library: [SCHVIZ](https://github.com/JacobeanRnD/SCHVIZ)**

A d3-based library for visualizing SCXML with SVG.

See [scion-web-simulation-environment/viz](https://github.com/jbeard4/scion-web-simulation-environment/tree/viz) for an example of how scxml-viz may be used.

Command-Line Usage
------------------

Graphics may be generated be generated from the command-line with PhantomJS. 

  `./render.sh in.scxml out.pdf [format]`

Here's an example of how it may be used:

  `./render.sh ../scxml-test-framework/test/parallel/test3.scxml out.pdf A4`
