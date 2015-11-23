// Constructor
var Maze = function(points) {
    this.points = points || [];
    this.polygon = new Polygon('maze', this.points);
    var self = this;
    this.scale = function(factor) {
        self.points = self.points.map(function(elt) {
            elt[0] *= factor;
            elt[1] *= factor;
            return elt;
        });
        self.polygon = new Polygon('maze', self.points);
    };
    this.draw = function() {
        self.polygon.draw();

        // Draw end point.
        if (self.end) {
            var cx = self.end[0];
            var cy = self.end[1];
            $('#end').attr('cx', cx);
            $('#end').attr('cy', cy);
        }
    }
}


