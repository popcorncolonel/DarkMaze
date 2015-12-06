function distance(x1, y1, x2, y2) {
    return Math.sqrt(
               Math.pow((x1-x2), 2) + 
               Math.pow((y1-y2), 2)
           );
}

function is_valid_click(player, x, y) {
    var dist = distance(player.x, player.y, x, y)
    return dist < player.clickradius;
}

function angle_with(player, point) {
    var angle_with_pt = angle_between(player.x, player.y, point.x, point.y)
    angle_with_pt -= player.angle;
    while (angle_with_pt > 180.0) {
        angle_with_pt -= 360.0;
    }
    while (angle_with_pt < -180.0) {
        angle_with_pt += 360.0;
    }
    return angle_with_pt;
}

function in_consideration(player, point) {
    var angle_with_pt = angle_with(player, point);
    return Math.abs(angle_with_pt) < player.radius_of_visibility / 2;
}

function right_turn(point1, point2, point3) {
    var is_right = 
           ((point2.x - point1.x) * (point3.y - point1.y) - 
            (point2.y - point1.y) * (point3.x - point1.x)) < 0;
    return !is_right; // not because the y-coordinate is flipped. 
}

function collision_with_polygon(player, angle, polygon) {
    return first_collision(player.x, player.y, angle, polygon);
}

function abs_diff(float1, float2) {
    return Math.abs(float1 - float2);
}

function are_equal_points(point1, point2) {
    if (abs_diff(point1.x, point2.x) < 0.00001) {
        if (abs_diff(point1.y, point2.y) < 0.00001) {
            return true;
        }
    }
    return false;
}

function add_window_point(player, stack, point_through, edge) {
    var pocket_emergence_pt = collision_with_edge(player, point_through, edge);
    var popped = stack.pop();
    stack.push(pocket_emergence_pt);
    stack.push(popped);
}

function collision_with_edge(player, point_through, edge) {
    var x = player.x;
    var y = player.y;

    var angle = angle_between(player.x, player.y, point_through.x, point_through.y);

    // Minus 90 because HTML5 orients angles vertical, and Math.cos expects horiz
    var angle_rads = (angle-90) * Math.PI / 180.0;
    // Hack - draw a long (but finite) "ray" from the player in
    // the direction of some specified angle to collide with all
    // the edges of the polygon.
    var ray_endpt = {
        x: x + 5000*Math.cos(angle_rads),
        y: y + 5000*Math.sin(angle_rads)
    };

    var intersection = checkLineIntersection( // O(1)
            x, y,
            ray_endpt.x, ray_endpt.y,
            edge.start.x, edge.start.y,
            edge.end.x, edge.end.y);
    if (intersection.x == null) {
        console.log('point through: ' + point_through);
        console.log('start: ' + edge.start);
        console.log('end: ' + edge.end);
        console.log('\n');
    }
    return new Point(intersection.x, intersection.y);
}

// Assume the polygon is drawn in CCW direction
function visibility_polygon(player, polygon) {
    var stack = [];

    // first point to the right
    var first_right = collision_with_polygon(player,
             (player.angle + player.radius_of_visibility / 2) % 360, polygon);
    draw_point(first_right.x, first_right.y, 'blue');

    // first point to the left (end of the visibility polygon
    var first_left = collision_with_polygon(player,
             (player.angle - player.radius_of_visibility / 2) % 360, polygon);
    draw_point(first_left.x, first_left.y, 'orange');

    stack.push(player.point);
    stack.push(new Point(first_right.x, first_right.y));
    //stack.push([first_right.end_x, first_right.end_y]);

    var i = 1;
    var points = polygon.points.slice(); // slice for copy of array
    points.push(points[0]);
    var in_range = false;
    // prev_point is the previous point on the polygon traversal (not the stack)
    var prev_point = points[0];
    // May walk around the polygon twice (if endpoint comes before startpoint)
    var first_loop = true; 

    function progress_algorithm(point) {
        if (point.x == first_right.end_x &&
            point.y == first_right.end_y) {
            prev_point = new Point(first_right.x, first_right.y);
            in_range = true;
        }
        if (point.x == first_left.end_x && point.y == first_left.end_y) {
            in_range = false;
        }

        // in range => this is between first_right and first_left on the poly.
        if (in_range) {
            if (in_consideration(player, point)) {
                var pivot_pt = stack[stack.length-1];
                if (!right_turn(player.point,
                                stack[stack.length-1],
                                point)) {
                    stack.push(new Point(x, y));
                    // This happens if the 2 most recent valid points weren't both polygon vertices in order
                    if (!are_equal_points(prev_point, pivot_pt)) {
                        // if we just emerged from a pocket
                        if (right_turn(player.point,
                                       pivot_pt,
                                       prev_point)) {
                            add_window_point(player, stack, pivot_pt,
                                             new Edge(prev_point, point));
                        } 
                        /*
                        else {
                            add_window_point(player, stack, point,
                                             new Edge(stack[stack.length-2], prev_point));
                        }
                        */
                    }
                    draw_point(point.x, point.y);
                }
                draw_point(point.x, point.y, 'red');
            }
        }
    }

    while (true) {
        var point = points[i];
        progress_algorithm(point)

        prev_point = point;
        i = (i + 1) % points.length;
        if (i == 0) {
            if (first_loop) {
                first_loop = false;
            } else {
                break;
            }
        }
    }

    //stack.push([first_left.start_x, first_left.start_y]);
    var last_point = new Point(first_left.x, first_left.y);
    progress_algorithm(last_point);
    stack.push(last_point);

    var points = [];
    stack.forEach(function(point) {
        points.push([point.x, point.y]);
    });
    var visibility = new Polygon('visibility', points);
    return visibility;
}

// Returns (x,y) coordinates of the first intersection
// with the polygon when shooting an infinite ray from (x,y) in 
// direction <angle>.
//  NOTE: In HTML5, angles are from the vertical axis and go CW
//  (0 degs is pointing up, 90 degs is pointing right)
// This is pretty much a sweep from x,y in the direction of angle.
function first_collision(x, y, angle, polygon) {
    // Minus 90 because HTML5 orients angles vertical, and Math.cos expects horiz
    var angle_rads = (angle-90) * Math.PI / 180.0;
    // Hack - draw a long (but finite) "ray" from the player in
    // the direction of some specified angle to collide with all
    // the edges of the polygon.
    var ray_endpt = {
        x: x + 5000*Math.cos(angle_rads),
        y: y + 5000*Math.sin(angle_rads)
    };

    var collisions = [];

    function get_collision_with_ray(prev, next) {
        var intersection = checkLineIntersection( // O(1)
                x, y,
                ray_endpt.x, ray_endpt.y,
                prev.x, prev.y,
                next.x, next.y);
        // Hack - if the intersection is on the ray shot out from
        // the player AND the edge, it is a valid consideration.
        if (intersection.onLine1 && intersection.onLine2) {
            intersection.start_x = prev.x;
            intersection.start_y = prev.y;
            intersection.end_x = next.x;
            intersection.end_y = next.y;
            collisions.push(intersection);
        }
    }

    var prev_pt = null;
    // O(n)
    polygon.points.forEach(function(point) {
        if (prev_pt != null) {
            get_collision_with_ray(prev_pt, point);
        } else {
            // first iteration - check polygon last edge
            get_collision_with_ray(polygon.points[polygon.points.length-1], polygon.points[0]);
        }
        prev_pt = point;
    });
    var first = null;
    // collisions invariant: onLine1==True, onLine2==True => x and y are both defined.
    collisions.forEach(function(collision) {
        if (first == null) {
            first = collision;
        } else {
            if (distance(x, y, first.x, first.y) > 
                distance(x, y, collision.x, collision.y)) {
                    first = collision;
            }
        }
    });
    return first;
}


// If the lines intersect, the result contains the x and y
// of the intersection (treating the lines as infinite) and booleans for whether
// line segment 1 or line segment 2 contain the point.
function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY,
                               line2StartX, line2StartY, line2EndX, line2EndY) {
    var denominator, a, b, numerator1, numerator2;
    var result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = (((line2EndY - line2StartY) * (line1EndX - line1StartX)) -
                   ((line2EndX - line2StartX) * (line1EndY - line1StartY)));
    if (denominator == 0) {
        // lines are parallel
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
    
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};



function main() {
    var x_offset = -200;
    var y_offset = 0;
    var maze = new Maze([ // don't ask me how i made this
        [x_offset+486, y_offset+126],
        [x_offset+423, y_offset+15],
        [x_offset+372, y_offset+33],
        [x_offset+456, y_offset+102],
        [x_offset+346, y_offset+191],
        [x_offset+388, y_offset+108],
        [x_offset+290, y_offset+33],
        [x_offset+328, y_offset+156],
        [x_offset+270, y_offset+151],
        [x_offset+328, y_offset+311],
        [x_offset+235, y_offset+298],
        [x_offset+333, y_offset+397],
        [x_offset+612, y_offset+336],
        [x_offset+478, y_offset+350],
        [x_offset+408, y_offset+258],
        [x_offset+425, y_offset+347],
        [x_offset+355, y_offset+260],
        [x_offset+486, y_offset+154],
        [x_offset+506, y_offset+257],
        [x_offset+463, y_offset+209],
        [x_offset+439, y_offset+285],
        [x_offset+741, y_offset+293],
        [x_offset+713, y_offset+150],
        [x_offset+697, y_offset+245],
        [x_offset+660, y_offset+194],
        [x_offset+660, y_offset+271],
        [x_offset+522, y_offset+205],
        [x_offset+724, y_offset+102],
        [x_offset+590, y_offset+149],
        [x_offset+588, y_offset+57],
        [x_offset+542, y_offset+124],
        [x_offset+484, y_offset+32]
    ]);
    /*
    var maze = new Maze([
        [x_offset+582, 84],
        [x_offset+548, 65],
        [x_offset+488, 47],
        [x_offset+421, 47],
        [x_offset+387, 85],
        [x_offset+471, 188]
    ]);
    */
    maze.start = maze.points[maze.points.length-1];
    //maze.end = maze.points[14];
    maze.scale(1.35);
    maze.draw(); 

    var player = new Player(maze);
     player.move_to(player.x, player.y - 25);
    // player.move_to(player.x + 7, player.y + 25);
    player.draw();
    $('#end').click(function(e) {
        //c-onsole.log(":)");
    });
    var onclick = function(e) {
        $('.drawn_point').remove();
        var x = e.offsetX;
        var y = e.offsetY;
        if (is_valid_click(player, x, y)) {
            player.move_to(x, y);
            player.draw();
        }
        var visibility = visibility_polygon(player, maze.polygon);
        visibility.draw();
    };
    angle_between 
    $('#maze').click(onclick);
    $('#visibility').click(onclick);
}

main();

// For debugging
function draw_point(x, y, color) {
    color = color || "pink";
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    shape.setAttribute("cx", x);
    shape.setAttribute("cy", y);
    shape.setAttribute("r",  5);
    shape.setAttribute("fill", color);
    shape.setAttribute("class", "drawn_point");
    $("svg").append(shape);
}

// For debugging
function draw_line(x1, y1, x2, y2) {
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
    shape.setAttribute("x1", x1);
    shape.setAttribute("y1", y1);
    shape.setAttribute("x2", x2);
    shape.setAttribute("y2", y2);
    shape.setAttribute("stroke", "pink");
    shape.setAttribute("style", "stroke-width:2");
    $("svg").append(shape);
}

