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
        if (!points_str) {
            console.log('points is []');
        }
        $('#'+self.id).attr('points', points_str);
    };
    this.distance_from = function(point) {
        function get_closest_pt(x, y, x1, y1, x2, y2) {
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

          // If param is in (0, 1), it's on the segment.
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
          
          // I want to be still on the inside. Move it to 2.5 + pixels in the DIRECTION of
          // edge(point, (xx, yy))

          var intersection = new Point(xx, yy);
          var vector = new Edge(point, intersection);
          // Length of vector is sqrt((x2-x1)^2+(y2-y1)^2)
          var length = Math.sqrt(
                (vector.start.x - vector.end.x) * (vector.start.x - vector.end.x) +
                (vector.start.y - vector.end.y) * (vector.start.y - vector.end.y)
          );
          var normalized_start = new Point(
                      vector.start.x / length,
                      vector.start.y / length);
          var normalized_end = new Point(
                      vector.end.x / length,
                      vector.end.y / length);

          var scale_factor = 5.0;
          intersection.x += scale_factor * (normalized_end.x - normalized_start.x);
          intersection.y += scale_factor * (normalized_end.y - normalized_start.y);

          return intersection;
        }

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
        var closest_pt = get_closest_pt(point.x, point.y,
            min_edge.start.x, min_edge.start.y,
            min_edge.end.x, min_edge.end.y
        );
        return [min_dist, min_edge, closest_pt];
    }
}

