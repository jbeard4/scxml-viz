var STATE_NAMES = ['scxml','state','parallel','initial','final'];

function toGraph(graphContainerNode,scxmlNode,size){

    console.log('toGraph',graphContainerNode,scxmlNode);

    var childScxmlNodes = d3.selectAll(scxmlNode.childNodes)[0].
                            filter(function(n){return n.nodeType === 1;}).
                            filter(function(n){return STATE_NAMES.indexOf(n.localName) > -1;});

    console.log('childScxmlNodes',childScxmlNodes);

    //create the DOM
    var graphContainers = graphContainerNode.selectAll('g.graphContainer').
            data(childScxmlNodes).
        enter().append('g')
                .attr('class','graphContainer');
    
    //create the layout
    function tick(){
        graphContainers.attr('transform',function(d) { 
            //console.log(d.x,d.y,d);
            return "translate(" + d.x + "," + d.y + ")"; 
        });

        bboxRect[0].forEach(function(rect,i){
            var bbox = graphContents[0][i].getBBox();
            rect.setAttribute('x',bbox.x);
            rect.setAttribute('y',bbox.y);
            rect.setAttribute('width',bbox.width);
            rect.setAttribute('height',bbox.height);
        });
    }

    if(childScxmlNodes.length){
        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .nodes(childScxmlNodes)
            .size(size ? size : [1,1])
            //.links(json.links)    //TODO
            .on("tick", tick)
            .start();

        graphContainers.call(force.drag);

        var bboxRect = graphContainers.append('rect').attr('class','graphBBox').attr('width',20).attr('height',20);
        var graphContents = graphContainers.append('g').attr('class','graphContents');

        //recursive call to create children
        graphContainers.each(function(d,i){
            toGraph(d3.select(graphContents[0][i]),d);
        });

    }else{
        //just create a circle for a basic state. this might not quite be correct, though...
        graphContainerNode.append('circle').attr('class','graphContents').attr('r',10);
    }
}

d3.xml('test.scxml','application/xml',function(doc){
    console.log('doc',doc);

    var width = 960,
        height = 500;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    toGraph(svg,doc.documentElement,[width,height]);
});

