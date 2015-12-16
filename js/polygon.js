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
    this.distance_from = function(point) {
        function dist_point_to_segment(x, y, x1, y1, x2, y2) {
          var A = x - x1;
          var B = y - y1;
          var C = x2 - x1;
          var D = y2 - y1;

          var dot = A * C + B * D;
          var len_sq = C * C + D * D;
          var param = -1;
          if (len_sq != 0) //in case of 0 length line
              param = dot / len_sq;

          var xx, yy;

          if (param < 0) {
            xx = x1;
            yy = y1;
          }
          else if (param > 1) {
            xx = x2;
            yy = y2;
          }
          else {
            xx = x1 + param * C;
            yy = y1 + param * D;
          }

          var dx = x - xx;
          var dy = y - yy;
          return Math.sqrt(dx * dx + dy * dy);
        }
        var min_dist = 10000000;
        var min_edge = null;
        self.edges.forEach(function(edge) {
            var dist = dist_point_to_segment(point.x, point.y,
                edge.start.x, edge.start.y,
                edge.end.x, edge.end.y);
            if (dist < min_dist) {
                min_dist = dist;
                min_edge = edge;
            }
        });
        return min_dist;
    }
}

