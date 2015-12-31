// Constructor
var Maze = function(points) {
    this.points = points || [];
    this.polygon = new Polygon('maze', this.points);
    var self = this;
    this.x_scale = function(factor) {
        self.points = self.points.map(function(elt) {
            elt[0] *= factor;
            return elt;
        });
        self.polygon = new Polygon('maze', self.points);
    };
    this.y_scale = function(factor) {
        self.points = self.points.map(function(elt) {
            elt[1] *= factor;
            return elt;
        });
        self.polygon = new Polygon('maze', self.points);
    };
    this.scale = function(factor) {
        self.points = self.points.map(function(elt) {
            elt[0] *= factor;
            elt[1] *= factor;
            return elt;
        });
        self.polygon = new Polygon('maze', self.points);
    };
    this.draw = function() {
        // Draw end point.
        if (self.end) {
            var cx = self.end.x;
            var cy = self.end.y;
            $('#end').attr('cx', cx);
            $('#end').attr('cy', cy);
            $('#end').hide();
        }
    }
    this.reveal = function() {
        self.polygon.draw();
        /*
        self.polygon.edges.forEach(function(edge) {
            edge.draw('white');
        });
        */
        $('#end').show();
    }
}


