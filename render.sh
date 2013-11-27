in=$1
out=$2
format=$3
phantomjs --web-security=no rasterize.js "viz.html#$in" $out $format
