function ScxmlViz(domAttachPoint,doc){
    var STATE_NAMES = ['scxml','state','parallel','final','history'];
    var scxmlNs = "http://www.w3.org/2005/07/scxml";

    function getChildStates(state){
        return d3.selectAll(state.childNodes)[0].
            filter(function(n){return n.nodeType === 1;}).
            filter(function(n){return STATE_NAMES.indexOf(n.localName) > -1;});
    }

    function getTransitionsFromStates(childScxmlNodes){
        var transitions = childScxmlNodes.
            map(function(node){return node.childNodes;}).
            map(function(domNodeList){return Array.prototype.slice.call(domNodeList);}).
            reduce(function(a,b){return a.concat(b);},[]).
            filter(function(node){return node.localName === 'transition';}).
            filter(function(transitionNode){return transitionNode.hasAttribute('target');});    //TODO: find a way to render targetless transitions

        transitions.forEach(function(transitionNode){
            transitionNode.source = transitionNode.parentNode;
            transitionNode.target = transitionNode.ownerDocument.getElementById(transitionNode.getAttribute('target'));
        });

        return transitions;
    }

    function traverseAndCountSubElements(node){
        var states = getChildStates(node);
        var sizes = states.map(traverseAndCountSubElements);
        var size = sizes.reduce(function(a,b){return a + b;},0) + 1;
        //console.log('size',size);
        node.size = size;
        if(size > 1) node.isParent = true;
        return size;
    }

    function normalizeInitialStates(node){

        if(node.isParent){
            if(node.localName !== 'parallel'){
                if(node.hasAttribute('initial')){
                    node.ownerDocument.getElementById(node.getAttribute('initial')).isInitial = true;
                }else{
                    var initialState;
                    done:
                    for(var i=0; i < node.childNodes; i++){
                        var state = node.childNodes[i];
                        if(state.localName === 'initial'){
                            for(var j=0; j < state.childNodes; j++){
                                var node2 = state[j];
                                if(node2.localName === 'transition'){
                                    initialState = node.ownerDocument.getElementById(node2.getAttribute('target'));
                                    break done;
                                }
                            }
                        }
                    }

                    if(!initialState){
                        //get the first state
                        initialState = getChildStates(node)[0];
                    }
                    initialState.isInitial = true; 
                }
            }

            getChildStates(node).forEach(normalizeInitialStates);   //recurse
        }
    }

    var width = 960,
        height = 500,
        color = d3.scale.category20c();

    d3.ns.prefix.scxml = "http://www.w3.org/2005/07/scxml";

    var padding = 20;

    var treemap = d3.layout.treemap()
        .padding(padding)
        .size([width, height])
        .value(function(d) { return d.size; })
        .children(getChildStates);

    var svg = d3.select(domAttachPoint).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 " + width + ' ' + height)
        .attr("preserveAspectRatio", "xMidYMid meet");

    var g = svg.append("g");

    var defs = svg.append("svg:defs");

    defs.selectAll("marker")
        .data(["suit", "licensing", "resolved"])
      .enter().append("svg:marker")
        .attr("id", 'transitionMarker')
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");


    //TODO: make dynamic based on bbox of the text? or just guess dimensions? maybe ask on the list about this
    var historyDim = 30,
        basicWidth = 10,
        basicHeight = 10,
        initialStateWidth = 10,
        initialStateHeight = 10;

    function getDistance(p1,p2){
        return Math.sqrt(Math.pow(p2[0] - p1[0],2) + Math.pow(p2[1] - p1[1], 2));
    }

    function getCenterPoints(d){
        if(d.isParent){
            //debugger;

            var dx = d.dx/2,
                dy = d.dy/2;

            return [
                [d.x + dx, d.y],     //top-center
                [d.x + dx/2, d.y],
                [d.x + dx + dx/2, d.y],
                [d.x + dx, d.y + d.dy],    //bottom-center
                [d.x + dx/2, d.y + d.dy],    
                [d.x + dx + dx/2, d.y + d.dy],   
                [d.x, d.y + dy],     //left-center
                [d.x, d.y + dy/2],    
                [d.x, d.y + dy + dy/2],     
                [d.x + d.dx, d.y + dy],     //right-center
                [d.x + d.dx, d.y + dy/2],     
                [d.x + d.dx, d.y + dy + dy/2]    
            ]; 
        }else if(d.localName === 'history'){
            var x = getInnerXCoordForBasicRectNode(d) + d.x,
                y = getInnerYCoordForBasicRectNode(d) + d.y + historyDim/2;
            return [[x,y]];
        }else{
            x = getInnerXCoordForBasicRectNode(d) + d.x;
            y = getInnerYCoordForBasicRectNode(d) + d.y;

            dx = basicWidth/2;
            dy = basicHeight/2;

            return [
                [x + dx,y],
                [x + dx,y + basicHeight],
                [x,y + dy],
                [x + basicWidth,y + dy]
            ]; 
        }
    }

    function getSourceAndDest(link,distanceThreshold){

        distanceThreshold = distanceThreshold || 0;

        var sourceCenterPoints = getCenterPoints(link.source),
            targetCenterPoints = getCenterPoints(link.target);

        //console.log(link,sourceCenterPoints,targetCenterPoints);  

        //cartesion product
        var centerPointCombinations = [];
        for(var i = 0; i < sourceCenterPoints.length; i++){
            for(var j = 0; j < targetCenterPoints.length; j++){
                centerPointCombinations.push([sourceCenterPoints[i],targetCenterPoints[j]]);
            } 
        } 

        var minDistance = Number.MAX_VALUE, minDistanceCombo;
        for(var k = 0; k < centerPointCombinations.length; k++){
            var points = centerPointCombinations[k];
            var distance = getDistance.apply(null,points);
            if(distance < minDistance && distance > distanceThreshold){
                minDistance = distance;
                minDistanceCombo = points; 
            }
        }

        return minDistanceCombo;
    }

    function edgeLayout(reverseEdge,d){
        //4 possibilities:
            //source is basic, target is basic
            //source is composite, target is composite
            //source is basic, target is composite
            //source is composite, target is basic
        //either way, pick the closest edge, and aim for the center.
        //left-of, right of, above, below, contains. pick the center point on the closest edge.
        //ah, edge routing... we also want to minimize edge crossings, so...
        //TODO: deal with the special case of looping back to ourself

        var points = getSourceAndDest(d,5);
        var sourceX = points[0][0], 
            sourceY = points[0][1], 
            destX = points[1][0], 
            destY = points[1][1],   
            dx = destX - sourceX,
            dy = destY - sourceY,
            dr = Math.sqrt(dx * dx + dy * dy);

        return reverseEdge ? 
            "M" + destX + "," + destY + "A" + dr + "," + dr + " 0 0,1 " + sourceX  + "," + sourceY : 
            "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,0 " + destX + "," + destY;
    }


    function getInnerXCoordForBasicRectNode(d){
        return d.dx / 2 - basicWidth/2;
    }

    function getInnerYCoordForBasicRectNode(d){
        return d.dy / 2 - basicHeight/2;
    }


    traverseAndCountSubElements(doc.documentElement);
    normalizeInitialStates(doc.documentElement);

    var nodes = treemap.nodes(doc.documentElement);
    var links = getTransitionsFromStates(nodes);
    treemap.links(links);

    var cell = svg.selectAll("g")
            .data(nodes)
        .enter().append("g")
            .attr("class", function(node){
                var c;
                if(node.localName === 'history'){
                    c = "cell history";
                }else if(node.localName === 'initial'){
                    c = "cell initial";
                }else if(node.parentNode && node.parentNode.localName === 'parallel'){
                    c = "cell orthogonalComponent";
                }else{
                    c = "cell";
                }

                if(node.isInitial) c += ' initial';

                return c;
            })
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr('id',function(d){return d.getAttribute('id');});

    var xmlSerializer = new XMLSerializer();
    cell.append('title').text(function(d){
        //debugger;
        return d3.selectAll(d.childNodes)[0]
                .filter(function(d){return d.localName === 'onentry' || d.localName === 'onexit';})
                .map(function(onentry){return xmlSerializer.serializeToString(onentry);}).join('\n');
    });

    cell.append("rect")
            .attr("rx", function(d){ return d.localName === 'history' ? d.dx : 10;})
            .attr("ry", function(d){ return d.localName === 'history' ? d.dy : 10;})
            .attr("x", function(d) { return d.isParent ? 0 : getInnerXCoordForBasicRectNode(d);})
            .attr("y", function(d) { return d.isParent ? 0 : getInnerYCoordForBasicRectNode(d);})
            .attr("width", function(d) { 
                if(d.isParent){ 
                    return d.dx - padding;
                }else if(d.localName === 'history'){
                    return historyDim;
                }else {
                    return basicWidth; 
                }
            })  //should be equal to bbox of the text
            .attr("height", function(d) { 
                if(d.isParent){ 
                    return d.dy - padding;
                }else if(d.localName === 'history'){
                    return historyDim;  //should be a circle
                }else {
                    return basicHeight; 
                }
            });

    cell.append("text")
            .attr("x", function(d) { return d.isParent ? 10 : d.dx / 2; })
            .attr("y", function(d) { return d.isParent ? 10 : d.dy / 2; })
            .attr("dy", function(d){ 
                if(d.localName ==='history'){ 
                    return historyDim / 2; 
                }else if(d.isParent){
                    return ".35em";
                }else{
                    return basicHeight + 4;
                }
            })
            .attr('dx',function(d){
                if(d.localName ==='history'){ 
                    //return historyDim / 2; 
                    return 10;
                }else{
                    return 0;
                }
            })
            .attr("text-anchor", function(d){ return d.isParent ? "" : "middle";})
            .text(function(d) { 
                if(d.localName === 'history'){
                    return (d.getAttribute('type') === 'deep' ? 'H*' : 'H'); 
                }else{
                    return d.getAttribute('id'); 
                }
            });

    var edgeDefinition = defs.selectAll('path.transition')
                .data(links)
            .enter().append('path')
                .attr('class','transition')
                .attr("marker-end", function(d) { return "url(#transitionMarker)"; })
                .attr("d", edgeLayout.bind(null,false))
                .attr("id",function(d,i){return 'transition' + i;});



    var reverseEdgeDefinition = defs.selectAll('path.reverseTransition')
                .data(links)
            .enter().append('path')
                .attr('class','reverseTransition')
                .attr("d", edgeLayout.bind(null,true))
                .attr("id",function(d,i){return 'reverseTransition' + i;});

    var edgeGroup = svg.selectAll('g.transition')
                .data(links)
            .enter().append('g')
                .attr('class','transition');

    var edge = edgeGroup.append('use')
                .attr('class','transition')
                .attr("xlink:href",function(d,i){return '#transition' + i;});

    var transitionLabels = edgeGroup.append('text')
                .attr('class','transitionLabel')
                .attr('dy','1em')
                .append('textPath')
                .attr("xlink:href",function(d,i){
                    var points = getSourceAndDest(d,5);
                    if(points[1][0] < points[0][0]){
                        return '#reverseTransition' + i;
                    }else{
                        return '#transition' + i;
                    }
                })
                .attr("startOffset",function(d){
                    var points = getSourceAndDest(d,5);
                    if(points[1][0] < points[0][0]){
                        return 30;  //a bit extra because of marker
                    }else{
                        return 10;
                    }
                })
                .text(function(d){
                    return (d.hasAttribute('event') ? d.getAttribute('event') : '') + 
                           (d.hasAttribute('cond') ? '[' + d.getAttribute('cond') + ']' : '');
                });

    edgeGroup.append('title').text(xmlSerializer.serializeToString.bind(xmlSerializer));

    return svg;
}