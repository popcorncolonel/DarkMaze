var Player = function(maze) {
    this.x = maze.start[0];
    this.y = maze.start[1];
    this.point = new Point(this.x, this.y);
    this.clickradius = 1000;
    this.radius_of_visibility = 100;
    this.angle = 165;
    var self = this;
    this.draw = function() {
        var cx = self.x;
        var cy = self.y;
        $('#player').attr('cx', cx);
        $('#player').attr('cy', cy);
    }
    this.move_to = function(x, y) {
        prev_x = self.x;
        prev_y = self.y;
        //var new_angle = angle_between(prev_x, prev_y, x, y);

        //self.angle = new_angle;
        self.x = x;
        self.y = y;
        self.point = new Point(x, y);
    }
}

// http://stackoverflow.com/questions/5736398
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");

    return d;       
}

function angle_between(prev_x, prev_y, x, y) {
    var dx = (x - prev_x);
    var dy = (prev_y - y);
    var new_angle = Math.atan(dx / dy) * 180.0 / Math.PI

    // edge cases
    if (dx < 0 && dy < 0) {
        new_angle += 180;
    }
    if (dy < 0 && dx > 0) {
        new_angle += 180;
    }
    if (dx == 0 && dy < 0) {
        new_angle += 180;
    }

    while (new_angle < 0.0) {
        new_angle += 360.0;
    }

    return new_angle;
}


