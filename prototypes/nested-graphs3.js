var STATE_NAMES = ['scxml','state','parallel','initial','final'];

function toGraph(graphContainerNode,scxmlNode){

    console.log('toGraph',graphContainerNode,scxmlNode);

    var childScxmlNodes = d3.selectAll(scxmlNode.childNodes)[0].
                            filter(function(n){return n.nodeType === 1;}).
                            filter(function(n){return STATE_NAMES.indexOf(n.localName) > -1;});

    //create the DOM
    var graphContainers = graphContainerNode.selectAll('g.graphContainer').
            data(childScxmlNodes).
        enter().append('g')
                .attr('class','graphContainer');
    

    //recursive call to create children
    graphContainers.each(function(d,i){
        toGraph(d3.select(this),d);
    });

    //add the bounding rect
    graphContainers.append('rect').attr('class','graphBBox').attr('width',20).attr('height',20);

    //create the layout
    function tick(){
        graphContainers.attr('transform',function(d) { 
            //console.log(d.x,d.y,d);
            return "translate(" + d.x + "," + d.y + ")"; 
        });
    }

    if(childScxmlNodes.length){
        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .nodes(childScxmlNodes)
            //.links(json.links)    //TODO
            .on("tick", tick)
            .start();

        graphContainers.call(force.drag);
    }
}

d3.xml('test.scxml','application/xml',function(doc){
    console.log('doc',doc);

    var width = 960,
        height = 500;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    toGraph(svg,doc.documentElement);
});

