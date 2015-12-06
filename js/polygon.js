var Point = function(x, y) {
    this.x = x;
    this.y = y;
}

var Edge = function(start, end) {
    this.start = start;
    this.end = end;
}

var Polygon = function(id, points) {
    this.id = id;
    this.points = [];
    var self = this; // ehhh javascript
    points.forEach(function(coords) {
        self.points.push(new Point(coords[0], coords[1]));
    });

    this.edges = [];
    var prev_point;
    if (this.points.length > 1) {
        prev_point = this.points[this.points.length-1];
    }
    this.points.forEach(function(point) {
        self.edges.push(new Edge(prev_point, point));
        prev_point = point;
    });

    this.draw = function() {
        var points_str = "";
        self.points.forEach(function(point) {
            points_str += point.x+','+point.y+' ';
        });
        $('#'+self.id).attr('points', points_str);
    };
}

