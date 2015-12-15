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

/*
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
*/

// #law of cosines
function find_angle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB)) * 180 / Math.PI;
}

function is_upwards_backtrack(player, edge) {
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
// Is point visible, with respect to the player and the edge? (passes in the pivot_pt for context)
function is_visible(player, edge, point, pivot_pt) {
    // ehhhhhh this will probably cause errors.
    if (are_equal_points(point, edge.start)) {
        if (right_turn(player.point, edge.start, edge.end)) {
            if (upwards_backtrack(player, edge)) {
                return true;
            }
            else {
                // Conjecture: If edge is a downwards backtrack,
                //             point is visible iff (pivot, point, edge.end) is a right turn
                if (right_turn(pivot_pt, point, edge.end)) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
    }
    var intersection = checkLineIntersection(
            player.x, player.y,
            point.x, point.y,
            edge.start.x, edge.start.y,
            edge.end.x, edge.end.y);
    var intersection_pt = new Point(intersection.x, intersection.y);

    // This fixed some roundoff errors
    var onLine2 = intersection.onLine2 ||
                  are_equal_points(edge.start, intersection_pt) || 
                  are_equal_points(edge.end, intersection_pt);
                  
    return !(intersection.onLine1 && onLine2);
}

// Gets the collision with the "infinite" ray defined by a segment (start/end determine direction)
function collision_with_ray(ray, edge) {
    var x = ray.start.x;
    var y = ray.start.y;

    var angle = angle_between(ray.start.x, ray.start.y, ray.end.x, ray.end.y);

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

    if (intersection.onLine1) {
        return intersection;
    }
    else {
        return null;
    }
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
/*
function visibility_polygon(player, polygon, html_id)
{
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
                    // INVARIANT: (player, pivot, point) is a right turn
                    var next_point = points[(i+1) % points.length];
                    if (is_visible(player, last_added_edge, next_point, point)) {
                        // Example: player = (0,0), pivot_pt = (-1, 1), point = (-0.5, 1) => 
                        //          this right turn is visible (cartesian coords, not js coords
                        console.log('YES dude');
                    } else {
                        console.log('NO dude');
                        point.invisible = true;
                    }
                    var upwards = upwards_backtrack(player, last_added_edge);
                    // If it's an upwards right turn
                    if (upwards) { // Want to ignore upwards back-tracks
                        point.is_upwards_backtrack = true;
                    } else { // if it's a downwards right turn
                        // If previous edge was a visible downwards backtrack
                        backtrack(last_added_edge);
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
*/

function visibility_polygon(player, polygon, html_id)
{
    // When a point is pushed on the (point) stack, the edge (starting at that point,
    // ending at the NEXT point in the iteration) is pushed on the edge stack.
    //   Invariant: stack.length == edge_stack.length.
    var stack = [];

    // first point to the right
    var first_right = collision_with_polygon(player,
             (player.angle + player.radius_of_visibility / 2) % 360, polygon);
    draw_point(first_right.x, first_right.y, 'blue');

    // first point to the left (end of the visibility polygon
    var first_left = collision_with_polygon(player,
             (player.angle - player.radius_of_visibility / 2) % 360, polygon);

    var first_collision_pt = new Point(first_right.x, first_right.y);
    stack.push(new Edge(player.point, first_collision_pt));

    stack.push(new Edge(first_collision_pt,
                             new Point(first_right.end_x, first_right.end_y)
                    ));

    var i = 0;
    var edges = polygon.edges.slice(); // slice for copy of array
    var in_range = false;

    var upwards_backtrack_mode = false;
    var downwards_backtrack_mode = false;

    // Invariant: previous edge was facing CCW in the eyes of the player
    // Upwards backtrack is if (prev_edge, edge) is a right turn.
    function is_upwards_backtrack(edge) {
        var is_backtrack = right_turn(player.point, edge.start, edge.end);
        if (is_backtrack) {
            var prev_edge = stack[stack.length-1];
            var is_right_turn = right_turn(prev_edge.start, edge.start, edge.end);
            return is_right_turn;
        }
        return false;
    }

    // Invariant: previous edge was facing CCW in the eyes of the player
    // Downwards backtrack is if (prev_edge, edge) is a left turn!
    function is_downwards_backtrack(edge) {
        var is_backtrack = right_turn(player.point, edge.start, edge.end);
        if (is_backtrack) {
            var prev_edge = stack[stack.length-1];
            var is_right_turn = right_turn(prev_edge.start, edge.start, edge.end);
            return !is_right_turn;
        }
        return false;
    }

    var ignore_stack = [];
    function upwards_backtrack(edge) {
        // If we emerge from the upwards backtrack, upwards_backtrack_mode = false
        var prev_edge = stack[stack.length-1];
        var visibility_ray = new Edge(player.point, prev_edge.end);
        var intersection_with_ray = collision_with_ray(visibility_ray, edge);
        if (intersection_with_ray && intersection_with_ray.onLine2) {
            // Exit upwards backtrack mode
            var new_edge_start = new Point(intersection_with_ray.x, intersection_with_ray.y);

            // Degenerate case -- ignore
            if (are_equal_points(new_edge_start, prev_edge.end)) {
                return;
            }
            // Degenerate case -- ignore
            // If the edge is going CW, push onto ingore stack & ignore
            if (right_turn(player.point, edge.start, edge.end)) {
                ignore_stack.push('ignore');
                return;
            }
            // If ignore stack is nonempty, ignore and pop
            if (ignore_stack.length != 0) {
                ignore_stack.pop();
                return;
            }
            var new_edge_end = edge.end;
            upwards_backtrack_mode = false;
            var partial_edge = new Edge(new_edge_start, new_edge_end);

            var window_edge = new Edge(prev_edge.end, new_edge_start)

            stack.push(window_edge);
            stack.push(partial_edge);
        }
    }

    // Returns false if covering_edge is between the point and the player
    function is_visible_given(covering_edge, point) {
        var intersection = checkLineIntersection(
                player.point.x, player.point.y,
                point.x, point.y,
                covering_edge.start.x, covering_edge.start.y,
                covering_edge.end.x, covering_edge.end.y
        );
        // "Line 2" is the covering edge.
        var onLine2 = intersection.onLine2 ||
                      are_equal_points(new Point(intersection.x, intersection.y), covering_edge.start) ||
                      are_equal_points(new Point(intersection.x, intersection.y), covering_edge.end);
        return !onLine2;
    }

    function edges_intersect(edge1, edge2) {
        var intersection = checkLineIntersection(
                edge1.start.x, edge1.start.y,
                edge1.end.x, edge1.end.y,
                edge2.start.x, edge2.start.y,
                edge2.end.x, edge2.end.y
        );
        return intersection.onLine1 && intersection.onLine2;
    }

    function is_completely_covered(covering_edge, covered_edge) {
        var covering_start = !is_visible_given(covering_edge, covered_edge.start);
        var covering_end = !is_visible_given(covering_edge, covered_edge.end);
        return covering_start && covering_end;
    }

    function add_partial_window(covering_edge, partially_covered_edge) {
        var intersection = checkLineIntersection(
                player.point.x, player.point.y,
                covering_edge.end.x, covering_edge.end.y,
                partially_covered_edge.start.x, partially_covered_edge.start.y,
                partially_covered_edge.end.x, partially_covered_edge.end.y
                );
        var intersection_pt = new Point(intersection.x, intersection.y);
        var partial_edge = new Edge(partially_covered_edge.start,
                                      intersection_pt);
        stack.pop();
        var window_edge = new Edge(partial_edge.end, covering_edge.end);
        stack.push(partial_edge);
        stack.push(window_edge);
    }

    function handle_crossed_window(edge) {
        var window_edge = stack.pop();
        var intersection = checkLineIntersection(
                edge.start.x, edge.start.y,
                edge.end.x, edge.end.y,
                window_edge.start.x, window_edge.start.y,
                window_edge.end.x, window_edge.end.y
        );
        var intersection_pt = new Point(intersection.x, intersection.y);
        var new_window = new Edge(window_edge.start, intersection_pt);
        stack.push(new_window);
        downwards_backtrack_mode = false;
        upwards_backtrack_mode = true;
        console.log('crossed window');
        new_window.draw('cyan');
    }

    // Invariant: edge is a downwards backtrack.
    function set_backtrack_mode(edge, next_edge) {
        var window_edge = stack[stack.length-1];
        if (right_turn(edge.start, edge.end, next_edge.end)) {
            // case 1
            downwards_backtrack_mode = false;
        }
        else if (right_turn(window_edge.start, window_edge.end, next_edge.end)) {
            // case 3
            downwards_backtrack_mode = true;
        }
        else {
            // case 2
            downwards_backtrack_mode = false;
        }
    }

    function downwards_backtrack(edge) {
        // While stack[-1] is completely covered by edge, stack.pop()
        while (is_completely_covered(edge, stack[stack.length-1])) {
            // Then we crossed a window! => enter upward backtrack mode
            if (edges_intersect(edge, stack[stack.length-1])) {
                handle_crossed_window(edge);
                return;
            }
            
            var deleted_edge = stack.pop();
            edge.draw('orange');
            deleted_edge.start.draw('red');
            deleted_edge.end.draw('red');
            console.log('i deleted stuff');
        }
        add_partial_window(edge, stack[stack.length-1]);

        // At this point, stack[-1] is PARTIALLY COVERED, so we pop it off once, and add
        //   a new partial window.
        var next_edge = edges[(i+1) % edges.length];
        set_backtrack_mode(edge, next_edge);
    }

    function progress_algorithm(edge) {
        if (first_right.end_x == first_left.end_x &&
            first_right.end_y == first_left.end_y) {
            // Off-by-1 case
            return true;
        }
        var done_with_algo = false;
        if (edge.start.x == first_right.end_x &&
            edge.start.y == first_right.end_y) {
            in_range = true;
        }
        if (in_range &&
            edge.end.x == first_left.end_x &&
            edge.end.y == first_left.end_y) {
            done_with_algo = true; // Say the algorithm is done.
        }
        if (!in_range) {
            return done_with_algo;
        }

        edge.draw('purple');

        /* Determine which mode we are in */

        // Detect upwards backtrack & ignore until done
        // Add window when returning from an upwards backtrack
        if (!upwards_backtrack_mode &&
              !downwards_backtrack_mode &&
              is_upwards_backtrack(edge)) {
            upwards_backtrack_mode = true;
            downwards_backtrack_mode = false;
        } else if (!upwards_backtrack_mode &&
                   !downwards_backtrack_mode &&
                   is_downwards_backtrack(edge)) {
            upwards_backtrack_mode = false;
            downwards_backtrack_mode = true;
            edge.draw('pink');
        } else if (downwards_backtrack_mode) {
            // Then we are in case 3 of "how can we continue?"
        }

        /* Deal with cases */
        if (upwards_backtrack_mode) {
            upwards_backtrack(edge);
        }
        else if (downwards_backtrack_mode) {
            downwards_backtrack(edge);
        }
        else {
            edge.draw('green');
            stack.push(edge);
        }

        // Detect downwards backtrack & pop until stack[-1] is visible
        // If we cross a window (if the intersection between edge and stack[-1] is on
        // both lines), enter upwards backtrack mode.

        // Detect downwards backtrack & pup until stack[-1] is visible

        return done_with_algo;
    }

    while (true) {
        edge = edges[i];
        result = progress_algorithm(edge);

        i = (i + 1) % edges.length;
        if (result == true) {
            break;
        }
    }

    var last_point = new Point(first_left.x, first_left.y);

    draw_point(last_point.x, last_point.y, 'orange');
    stack.push(new Edge(stack[stack.length-1].end, last_point));

    var final_points = [];
    final_points.push([stack[0].start.x, stack[0].start.y]);
    stack.forEach(function(edge) {
        final_points.push([edge.end.x, edge.end.y]);
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
    var x_offset = -100;
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
        [x_offset+397, 134],
        [x_offset+417, 135],
        [x_offset+444, 140],
        [x_offset+514, 163],
        [x_offset+561, 180],
        [x_offset+586, 248],
        [x_offset+588, 319],
        [x_offset+551, 349],
        [x_offset+495, 366],
        [x_offset+393, 346],
        [x_offset+294, 319],
        [x_offset+259, 65],
        [x_offset+500, 55],
        [x_offset+216, 55],
        [x_offset+209, 155],
        [x_offset+220, 286],
        [x_offset+247, 340],
        [x_offset+390, 380],
        [x_offset+481, 396],
        [x_offset+584, 374],
        [x_offset+638, 307],
        [x_offset+620, 231],
        [x_offset+602, 175],
        [x_offset+519, 136],
        [x_offset+413, 99],
        [x_offset+321, 96],
        [x_offset+307, 160],
        [x_offset+375, 286],
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
    var maze = new Maze([
        //[x_offset+344, 236],
        //[x_offset+315, 230],
        //[x_offset+310, 151],
        [x_offset+354, 114],
        [x_offset+526, 116],
        [x_offset+559, 175],
        [x_offset+522, 214],
        //[x_offset+514, 152],
        //[x_offset+365, 134],
        //[x_offset+335, 201],
        //[x_offset+392, 202],
        //[x_offset+421, 255],
        [x_offset+454, 270],
        [x_offset+578, 256],
        [x_offset+589, 112],
        [x_offset+453, 72],
        [x_offset+301, 95],
        [x_offset+243, 160],
        [x_offset+290, 257],
        [x_offset+414, 300],
    ]);
    var maze = new Maze([
        [x_offset+424, 265],
        [x_offset+445, 240],
        [x_offset+445, 184],
        [x_offset+503, 220],
        [x_offset+525, 269],
        [x_offset+611, 284],
        [x_offset+489, 142],
        [x_offset+360, 124],
        [x_offset+279, 170],
        [x_offset+373, 301],
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
    
    
    maze.start = maze.points[0];
    //maze.end = maze.points[14];
    maze.scale(1.35);
    maze.draw(); 
    maze.points.forEach(function(point) {
        draw_point(point[0], point[1], 'grey');
    });

    var player = new Player(maze);
    player.move_to(player.x+0, player.y - 5);
    player.move_to(793, 360);
    player.angle = 235;

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

