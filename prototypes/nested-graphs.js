function generateRandomGraph(numNodes,linkDensity){

    linkDensity = linkDensity || 1;

    var nodes = d3.range(numNodes).map(Object);
    var links = generateRandomLinkGraph(nodes,linkDensity);

    return {
        nodes : nodes,
        links : links
    };
}

function generateRandomLinkGraph(nodes,linkDensity){
    return nodes.map(function(node){
        return d3.range(linkDensity).map(function(){
            return {
                source : node,
                target :  nodes[Math.round(Math.random() * (nodes.length-1))] 
            };
        });
    }).reduce(function(a,b){return a.concat(b);},[]);
}

function generateStronglyConnectedLinks(nodes){
    return nodes.map(function(node){
        return nodes.map(function(node2){
            return {
                source : node,
                target : node2
            };
        });
    }).reduce(function(a,b){return a.concat(b);},[]);
}

function makeSubGraph(json,parent,parentTickCb){

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30);

    var g = parent.append('g').attr('class','sub');

    var link = g.selectAll("line.sub")
            .data(json.links)
        .enter().append("line").attr('class','sub');

    var enter = g.selectAll("circle.sub")
            .data(json.nodes)
        .enter();

    console.log('subgraph enter',enter);

    var node = enter.append("circle")
            .attr("r", radius - 0.75).attr('class','sub')
            .call(force.drag);

    console.log('node',node);

    force
        .nodes(json.nodes)
        .links(json.links)
        .on("tick", tick)
        .start();

    function tick() {
        node.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
                .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

        link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

        parentTickCb();
    }

    console.log('subgraph g',g);

    return g;
}

function makeParentGraph(graphs){

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(150)
        .size([width, height]);

    var g = svg.append('g');

    var graphNodes = graphs.map(function(graph){
        var parentGNode = g.append('g').attr('class','parent');
        var boundingRect = parentGNode.append('rect').attr('class','boundingRect');

        //we get back <g> containing module contents
        var subGraphContent = makeSubGraph(graph,parentGNode,function(){
            //tick listener
            var rect = subGraphContent.node().getBBox(); 
            //console.log('tick',rect); 
            boundingRect.attr("x",rect.x); 
            boundingRect.attr("y",rect.y); 
            boundingRect.attr("width",rect.width); 
            boundingRect.attr("height",rect.height); 
        });

        return parentGNode; 
    });
    //var graphNodes = graphs.map(function(graph){return {};});

    console.log('graphNodes',graphNodes);

    var updateNodes = g.selectAll('g.parent')
                        .data(graphNodes);

    var enter = updateNodes.enter();

    console.log('update',updateNodes);
    console.log('enter',enter);

    //updateNodes.append('rect');
    //    .attr('width','100px')
    //    .attr('height','100px');

    console.log('updateNodes',updateNodes);

    //var links = generateRandomLinkGraph(graphNodes,1);
    var links = generateStronglyConnectedLinks(graphNodes);

    console.log('links',links); 

    /*
    var link = g.selectAll("line")
            .data(links)
        .enter().append("line");
    */

    updateNodes.call(force.drag);

    force
        .nodes(graphNodes)
        .links(links)
        .on("tick", tick)
        .start();

    function tick() {
        updateNodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        /*
        link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        */
    }

}

var width = 960,
    height = 500,
    radius = 6,
    fill = d3.scale.category20();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//make two subgrpahs

/*
var json1 = generateRandomGraph(10,2);
console.log(json1);
var g1 = makeSubGraph(json1);

var json2 = generateRandomGraph(10,2);
console.log(json2);
var g2 = makeSubGraph(json2);

//make a parent graph, and place the two subgraphs inside
var g3 = makeParentGraph({
    nodes : [g1,g2],
    links : [{
        source : g1,
        target : g2
    }]
});
*/

//create an array of graphs
var graphs = d3.range(3).map(function(){return generateRandomGraph(5,3);});
console.log('graphs',graphs);
makeParentGraph(graphs);
