// Constructor
var Polygon = function(id, points) {
    this.id = id;
    this.points = points || [];
    var self = this; // ehhh javascript
    this.draw = function() {
        var points_str = "";
        self.points.forEach(function(elt) {
            points_str += elt[0]+','+elt[1]+' ';
        });
        $('#'+self.id).attr('points', points_str);
    };
}

