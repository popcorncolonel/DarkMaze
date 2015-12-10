var Point = function(x, y) {
    this.x = x;
    this.y = y;
    var self = this;
    this.draw = function(color) {
        color = color || 'pink';
        draw_point(self.x, self.y, color);
    }
}
Point.prototype.toString = function() {
    return "("+this.x+", "+this.y+")";
}

var Edge = function(start, end) {
    this.start = start;
    this.end = end;
    var self = this;
    this.draw = function(color) {
        color = color || 'pink';
        draw_edge(self, color);
    }
}
Edge.prototype.toString = function() {
    return "["+this.start.toString()+", "+this.end.toString()+"]";
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

    this.edge_with_this_point = function(point) {
        var correct_edge = null;
        self.edges.forEach(function(edge) {
            if (is_on_segment(point, edge)) {
                correct_edge = edge;
            }
        });
        return correct_edge;
    };
}

