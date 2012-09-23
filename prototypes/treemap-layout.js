var path = 
    //'test.scxml';
    //'test/parallel+interrupt/test5.scxml';
    'canvas.xml';
    //'editor-behaviour.xml';
    //'test/history/history5.scxml';

d3.xml(path,'application/xml',ScxmlViz.bind(null,document.body));
