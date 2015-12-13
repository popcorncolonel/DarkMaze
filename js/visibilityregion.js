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
    return true;
    var angle_with_pt = angle_with(player, point);
    return Math.abs(angle_with_pt) <= player.radius_of_visibility / 2;
}

function cross_product(point1, point2, point3) {
    return ((point2.x - point1.x) * (point3.y - point1.y) - 
            (point2.y - point1.y) * (point3.x - point1.x));
}

function right_turn(point1, point2, point3) {
    var is_right = cross_product(point1, point2, point3) <= 0;
    return !is_right; // not because the y-coordinate is flipped. 
}

function point_dist(a, b) {
    return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
}
function is_on_segment(point, edge) {
    return (point_dist(edge.start, point) + point_dist(edge.end, point) -
            point_dist(edge.start, edge.end)) < 0.00001;
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

function print_stack_trace() {
    var e = new Error('dummy');
    var call_stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/file:.*.js:/gm, 'line ')
        .replace(/:\d+/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    call_stack.pop();
    call_stack.pop();
    call_stack.pop();
    call_stack.splice(0, 1);
    console.log(call_stack);
}

function add_window_point(player, stack, edge_stack, point_through, edge) {
    var pocket_emergence_pt = collision_with_edge(player, point_through, edge);
    var pocket_edge = new Edge(pocket_emergence_pt, edge.end);

    var intersection = checkLineIntersection(
            player.point.x, player.point.y,
            point_through.x, point_through.y,
            edge.start.x, edge.start.y,
            edge.end.x, edge.end.y);

    if (intersection.onLine2) {
        edge_stack.push(pocket_edge);
        stack.push(pocket_emergence_pt);
    }
    else {
    }

    return pocket_emergence_pt;
}

// #law of cosines
function find_angle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB)) * 180 / Math.PI;
}

function upwards_backtrack(player, edge) {
    var is_right_turn = right_turn(player.point, edge.start, edge.end);
    var line_angle = find_angle(player.point, edge.start, edge.end) - 90;
    return is_right_turn && line_angle > 0 && line_angle < 90;
}

// Reasoning: http://i.imgur.com/XQ7YlxU.png 
function downwards_backtrack_is_visible(player, edge, point, pivot_pt) {
    // Invariant: point == edge.start.
    var prev_edge = new Edge(pivot_pt, point);
    var edge2 = new Edge(player.point, edge.end);
    var intersection = checkLineIntersection(
            prev_edge.start.x, prev_edge.start.y,
            prev_edge.end.x, prev_edge.end.y,
            edge2.start.x, edge2.start.y,
            edge2.end.x, edge2.end.y);
    var intersection_pt = new Point(intersection.x, intersection.y);
    var dist_to_intersection = point_dist(player.point, intersection_pt);
    var dist_to_edge_end = point_dist(player.point, edge.end);
    var is_really_visible = dist_to_intersection < dist_to_edge_end;
    return is_really_visible;
}

// this fn is a gd mess.
function is_visible(player, edge, point, pivot_pt) {
    // ehhhhhh this will probably cause errors.
    edge.draw();
    if (are_equal_points(point, edge.start)) {
        if (upwards_backtrack(player, edge)) {
            return true;
        }
        else {
            if (right_turn(player.point, edge.start, edge.end)) {
                console.log('right turn..');
                var result = downwards_backtrack_is_visible(player, edge, point, pivot_pt);
                return false;
                console.log(result);
                return result;
            }
        }
    }
    if (is_on_segment(point, edge)) {
        return true;
    }
    var intersection = checkLineIntersection(
            player.x, player.y,
            point.x, point.y,
            edge.start.x, edge.start.y,
            edge.end.x, edge.end.y);
    var intersection_pt = new Point(intersection.x, intersection.y);
    var onLine2 = intersection.onLine2 ||
                  are_equal_points(edge.start, intersection_pt) || 
                  are_equal_points(edge.end, intersection_pt);
                  
    return !(intersection.onLine1 && onLine2);
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
    return new Point(intersection.x, intersection.y);
}

// Assume the polygon is drawn in CCW direction
function visibility_polygon(player, polygon, html_id) {
    // When a point is pushed on the (point) stack, the edge (starting at that point,
    // ending at the NEXT point in the iteration) is pushed on the edge stack.
    //   Invariant: stack.length == edge_stack.length.
    var edge_stack = []; 
    var stack = [];

    // first point to the right
    var first_right = collision_with_polygon(player,
             (player.angle + player.radius_of_visibility / 2) % 360, polygon);
    draw_point(first_right.x, first_right.y, 'blue');

    // first point to the left (end of the visibility polygon
    var first_left = collision_with_polygon(player,
             (player.angle - player.radius_of_visibility / 2) % 360, polygon);

    var first_collision_pt = new Point(first_right.x, first_right.y);
    stack.push(player.point);
    edge_stack.push(new Edge(player.point, first_collision_pt));

    stack.push(first_collision_pt);
    edge_stack.push(new Edge(first_collision_pt,
                             new Point(first_right.end_x, first_right.end_y)
                    ));

    var i = 1;
    var points = polygon.points.slice(); // slice for copy of array
    var in_range = false;
    // prev_point is the previous point on the polygon traversal (not the stack)
    var prev_point = points[0];
    // May walk around the polygon twice (if endpoint comes before startpoint)
    function add_window_points(point, pivot_pt) {
        // There are 2 kinds of window points that need to be added: 
        //   1) Where the polygon traversal just emerged from a pocket, and we need to
        //      the edge satisfying: s.start is not visible and s.end is visible
        //   2) When the polygon traversal just back_tracked and we need to add an edge 
        //      that goes through the end of the downwards back-track and collides with another
        //      polygon edge

        // Case 1 - Traversal just emerged from a pocket
        if (!are_equal_points(prev_point, pivot_pt)) {
            if (right_turn(player.point,
                           pivot_pt,
                           prev_point))
            {
                add_window_point(player, stack, edge_stack, pivot_pt,
                                 new Edge(prev_point, point));
            }
        }
    }

    function backtrack(last_added_edge) {
        var deleted_edge = null;
        while (stack.length > 2 &&
               !is_visible(player,
                           last_added_edge,
                           stack[stack.length-1], stack[stack.length-2]))
        {
            deleted_edge = edge_stack.pop();
            deleted_point = stack.pop();

            deleted_point.draw('red');
            deleted_edge.draw('red');
            console.log('i deleted stuff');
        }
        console.log('backtracking.....');
        var edge = edge_stack[stack.length-1];

        var upwards = upwards_backtrack(player, last_added_edge);
        upwards = upwards || upwards_backtrack(player, edge);
        if (!upwards) {
            var point_through = last_added_edge.end;
            // if downwards valid backtrack, point_through -> last_added_edge.start
            if (are_equal_points(edge.start, last_added_edge.start) && 
                downwards_backtrack_is_visible(player, edge, stack[stack.length-1], stack[stack.length-2])) {
                point_through = last_added_edge.start;
            }
            
            var emergence_pt = add_window_point(player, stack, edge_stack,
                             point_through, edge);
        }
        else {
        }
    }

    function progress_algorithm(point) {
        var done_with_algo = false;
        if (point.x == first_right.end_x &&
            point.y == first_right.end_y) {
            prev_point = new Point(first_right.x, first_right.y);
            in_range = true;
        }
        if (in_range && point.x == first_left.end_x && point.y == first_left.end_y) {
            // Try to add a window one last time
            var pivot_pt = stack[stack.length-1];
            if (right_turn(player.point, pivot_pt, prev_point) &&
               !right_turn(player.point, pivot_pt, point)) {
                var last_edge = new Edge(prev_point, point);
                add_window_point(player, stack, edge_stack, pivot_pt,
                                 last_edge);
            }
            done_with_algo = true; // say the algorithm is done.
            in_range = false;
            return done_with_algo;
        }

        // in range => this is between first_right and first_left on the poly.
        if (in_range) {
            if (in_consideration(player, point)) {
                // pivot_pt is the last added point
                var pivot_pt = stack[stack.length-1];

                var next_edge = new Edge(point, points[(i+1) % points.length]);
                var last_added_edge = new Edge(pivot_pt, point);

                if (!right_turn(player.point, pivot_pt, point)) {
                    if (!is_visible(player, edge_stack[edge_stack.length-1], point, pivot_pt)) {
                        add_window_points(point, pivot_pt);
                    }

                    // Just emerged from a pocket.
                    if (right_turn(player.point, pivot_pt, prev_point)) {
                        var window_emergence_edge = new Edge(prev_point, point);
                        add_window_point(player, stack, edge_stack, pivot_pt, 
                            window_emergence_edge);
                    }

                    // update the pivot pt and the last added edge
                    pivot_pt = stack[stack.length-1];
                    last_added_edge = new Edge(pivot_pt, point);
                } else {
                    // if it's a right turn
                    var upwards = upwards_backtrack(player, last_added_edge);
                    // if it's an upwards right turn
                    if (upwards) { // Want to ignore upwards back-tracks
                        point.is_upwards_backtrack = true;
                    } else { // if it's a downwards right turn
                        // If previous edge was a visible downwards backtrack
                        var d_b_is_visible = downwards_backtrack_is_visible(
                                    player, last_added_edge, pivot_pt, stack[stack.length-2]);
                        if (is_on_segment(pivot_pt,
                                          new Edge(player.point, stack[stack.length-2])))
                        {
                            // The last pt added was a window point
                            d_b_is_visible = false;
                        }
                        if (!d_b_is_visible) { // if it's an invisible downwards right turn
                            console.log('back-tracking b/c right turn and downwards back-track');
                            backtrack(last_added_edge);
                        } else {
                            point.invisible = true;
                        }
                    }
                }
                // If prev_point != pivot_pt, try to back_track (it won't always do something)
                if (!are_equal_points(prev_point, pivot_pt))
                {
                    console.log('backtracking b/c prev_pt != pivot');
                    backtrack(last_added_edge);
                }

                if (point.is_upwards_backtrack != true && point.invisible != true) {
                    stack.push(point);
                    edge_stack.push(next_edge);
                }
                else {
                }
                point.invisible = false;
                point.is_upwards_backtrack = false;
            }
        }
        else {
            //draw_point(point.x, point.y, 'grey');
        }
        while (are_equal_points(stack[stack.length-1], stack[stack.length-2])) {
            edge_stack.pop();
            stack.pop();
        }
        while (stack.length > 2 &&
               are_equal_points(stack[stack.length-2], stack[stack.length-3])) {
            edge_stack.splice(edge_stack.length-2, 1);
            stack.splice(stack.length-2, 1);
        }
        return done_with_algo;
    }

    while (true) {
        point = points[i];
        result = progress_algorithm(point);
        prev_point = point;

        i = (i + 1) % points.length;
        if (result == true) {
            break;
        }
    }

    var last_point = new Point(first_left.x, first_left.y);

    in_range = true;

    draw_point(last_point.x, last_point.y, 'orange');
    stack.push(last_point);
    edge_stack.push(new Edge(last_point, player.point));

    var final_points = [];
    stack.forEach(function(point) {
        final_points.push([point.x, point.y]);
    });
    var visibility = new Polygon(html_id, final_points);
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
function draw_edge(edge, color) {
    color = color || "pink";
    var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
    shape.setAttribute("x1", edge.start.x);
    shape.setAttribute("y1", edge.start.y);
    shape.setAttribute("x2", edge.end.x);
    shape.setAttribute("y2", edge.end.y);
    shape.setAttribute("style", "stroke-width:3");
    shape.setAttribute("stroke", color);
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
    var x_offset = -00;
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
        [x_offset+308, 322],
        [x_offset+396, 178],
        [x_offset+330, 153],
        [x_offset+420, 106],
        [x_offset+450, 76],
        [x_offset+390, 86],
        [x_offset+380, 96],
        [x_offset+179, 92],
        [x_offset+266, 144],
        [x_offset+229, 191],
    ]);
    var maze = new Maze([
        [x_offset+286, 345],
        [x_offset+335, 240],
        [x_offset+239, 51],
        [x_offset+279, 228],
        [x_offset+209, 202],
    ]);
    var maze = new Maze([
        [x_offset+185, 275],
        [x_offset+221, 189],
        [x_offset+167, 145],
        [x_offset+215, 104],
        [x_offset+115, 113],
    ]);
    var maze = new Maze([
        [x_offset+349, 321],
        [x_offset+518, 46],
        [x_offset+53, 42],
        [x_offset+431, 87],
        [x_offset+321, 123],
    ]);
    var maze = new Maze([
        [x_offset+522, 236],
        [x_offset+556, 244],
        [x_offset+573, 255],
        [x_offset+754, 237],
        [x_offset+445, 212],
        [x_offset+543, 191],
        [x_offset+447, 173],
        [x_offset+524, 96],
        [x_offset+367, 154],
        [x_offset+359, 235],
    ]);
    */
    var maze = new Maze([
        [x_offset+344, 236],
        [x_offset+315, 230],
        [x_offset+310, 151],
        [x_offset+354, 114],
        /*
        [x_offset+526, 116],
        [x_offset+559, 175],
        [x_offset+522, 214],
        [x_offset+514, 152],
        [x_offset+365, 134],
        [x_offset+335, 201],
        [x_offset+392, 202],
        [x_offset+421, 255],
        [x_offset+454, 270],
        [x_offset+578, 256],
        [x_offset+589, 112],
        [x_offset+453, 72],
        */
        [x_offset+301, 95],
        [x_offset+243, 160],
        [x_offset+290, 257],
        [x_offset+414, 300],
    ]);
    
    maze.start = maze.points[0];
    //maze.end = maze.points[14];
    maze.scale(1.35);
    maze.draw(); 

    var player = new Player(maze);
    player.move_to(player.x+0, player.y - 5);
    player.move_to(393, 265);
    player.angle = 135;

    player.draw();
    $('#end').click(function(e) {
        alert(":)");
    });
    var onclick = function(e) {
        if (dragging) {
            $('.drawn_point').remove();
            $('line').remove();
            var x = e.offsetX;
            var y = e.offsetY;
            if (is_valid_click(player, x, y)) {
                player.move_to(x, y);
                player.draw();
            }
            var visibility = visibility_polygon(player, maze.polygon, 'visibility');
            visibility.draw();

            var lightbulb = true; // full 360 degree radius of vision
            if (lightbulb) {
                player.angle += 90;

                visibility = visibility_polygon(player, maze.polygon, 'visibility2');
                visibility.draw();
                player.angle += 90;

                visibility = visibility_polygon(player, maze.polygon, 'visibility3');
                visibility.draw();
                player.angle += 90;

                visibility = visibility_polygon(player, maze.polygon, 'visibility4');
                visibility.draw();
                player.angle += 90;
                player.angle -= 360;
            }
        }
    };
    var visibility = visibility_polygon(player, maze.polygon, 'visibility');
    visibility.draw();
    /*
    $('#maze').click(onclick);
    $('#visibility').click(onclick);
    */

    dragging = false;
    $('polygon').mousedown(function(e) {dragging = true;onclick(e);})
                .mousemove(onclick)
                .mouseup(function(e) {dragging = false;console.log(dragging);});
    $('#player').mousedown(function(e) {dragging = true;})
                .mousemove(onclick) 
                .mouseup(function(e) {dragging = false;console.log('PLAYER');});
}


main();

