var STATE_NAMES = ['scxml','state','parallel','initial','final'];

function getChildStates(state){
    return d3.selectAll(state.childNodes)[0].
        filter(function(n){return n.nodeType === 1;}).
        filter(function(n){return STATE_NAMES.indexOf(n.localName) > -1;});
}

function getLinksFromStates(childScxmlNodes){
    return childScxmlNodes.
        map(function(node){return node.childNodes;}).
        map(function(domNodeList){return Array.prototype.slice.call(domNodeList);}).
        reduce(function(a,b){return a.concat(b);},[]).
        filter(function(node){return node.localName === 'transition';}).
        map(function(transitionNode){return {source : transitionNode.parentNode, target : transitionNode.ownerDocument.getElementById(transitionNode.getAttribute('target'))};});
}

function traverseAndCountSubElements(node){
    var states = getChildStates(node);
    var sizes = states.map(traverseAndCountSubElements);
    var size = sizes.reduce(function(a,b){return a + b;},0) + 1;
    console.log('size',size);
    node.size = size;
    return size;
}

var width = 960,
    height = 500,
    color = d3.scale.category20c();

d3.ns.prefix.scxml = "http://www.w3.org/2005/07/scxml";

var treemap = d3.layout.treemap()
    .padding(20)
    .size([width, height])
    .value(function(d) { return d.size; })
    .children(getChildStates);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(-.5,-.5)");

var path = 
    //'test.scxml';
    'test/parallel+interrupt/test5.scxml';

d3.xml(path,'application/xml',function(doc){

    traverseAndCountSubElements(doc.documentElement);

    var nodes = treemap.nodes(doc.documentElement);
    var links = getLinksFromStates(nodes);
    treemap.links(links);

    var cell = svg.selectAll("g")
            .data(nodes)
        .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    cell.append("rect")
            .attr("width", function(d) { return d.dx; })
            .attr("height", function(d) { return d.dy; })
            .style("fill", function(d) { return getChildStates(d).length ? color(d.getAttribute('id')) : null; });

    cell.append("text")
            .attr("x", function(d) { return d.dx / 2; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) { return getChildStates(d).length ? null : d.getAttribute('id'); });
});
