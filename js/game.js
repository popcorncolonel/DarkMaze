function adjust_message_size() {
    var width = $('svg').width();
    var height = $('svg').height();

    var middle_of_svg = {
        x: width / 2,
        y: height / 2
    };
    $('#messageparent').attr('transform', 'translate(' + middle_of_svg.x + ')');
    $('#messageparent').attr('y', middle_of_svg.y);

    var message_width = $('#messageparent').width();
    var message_height = $('#messageparent').height();

    $('#messagebox').attr('width', message_width + 60);
    $('#messagebox').attr('height', message_height / 2 + 60);
    $('#messagebox').attr('x', middle_of_svg.x - (message_width / 2 + 30));
    $('#messagebox').attr('y', middle_of_svg.y - (message_height / 2 + 30));
}

function bind_click_to_message(callback) {
    $('#messagebox').css("cursor", "pointer");
    $('#messageparent').css("cursor", "pointer");
    $('#svgmessage').css("cursor", "pointer");
    $('#messagebox').click(callback);
    $('#messageparent').click(callback);
}

function unbind_message() {
    $('#messagebox').unbind();
    $('#messageparent').unbind();
    $('#messagebox').css("cursor", "default");
    $('#messageparent').css("cursor", "default");
    $('#svgmessage').css("cursor", "default");
}

function show_message() {
    $('#messagebox').show();
    $('#messageparent').show();
    $('svg').append($('#messagebox'));
    $('svg').append($('#messageparent'));
}

function hide_message() {
    $('#messageparent').hide();
    $('#messagebox').hide();
}

function display_message(message, duration) {
    $('#svgmessage').html(message);
    adjust_message_size();
    show_message();
    if (duration && duration > 0) {
        setTimeout(hide_message, duration);
    }
}

// When the timer is going up.
function get_upscore(ms) {
    var score = 300 + 10000 / Math.sqrt(ms); // Finishing faster = more points. Constant 300 + for happiness factor.
    score = Math.round(score);
    return score;
}

// When the timer is going down.
function get_downscore(finish_time, ms) {
    // ms_diff is how long it took them to find the end
    // 0 < ms_diff < finish_time
    var ms_diff = (finish_time - ms) / 1.5; // 1.5 because the timer counts down 1.5x faster than it counts up

    var scaling_factor = 50000;
    var score = (scaling_factor / Math.sqrt(ms_diff)) - (scaling_factor / Math.sqrt(finish_time / 1.5)); // Getting back to the start faster = more point.
    score = Math.max(0, Math.round(score));
    return score;
}

function get_difficulty_multiplier(difficulty) {
    var difficulty_multiplier = 1;
    switch (difficulty) {
        case "medium":
            difficulty_multiplier = 1.5;
            break;
        case "hard":
            difficulty_multiplier = 2;
            break;
    }
    return difficulty_multiplier;
}

// current_ms is the time they came back to the start (in centiseconds)
// finish_time is the time they found the actual end of the maze (in centiseconds)
//      current_ms will be less than finish_time, because the timer counts down.
// 0 < current_ms < finish_time
function assign_score(current_ms, finish_time, difficulty) {
    var difficulty_multiplier = get_difficulty_multiplier(difficulty);
    var init_score = get_upscore(finish_time);
    var return_score = get_downscore(finish_time, current_ms);

    return difficulty_multiplier * (init_score + return_score);
}

function unbind_svg() {
    $('svg').unbind('mousedown');
    $('svg').unbind('mousemove');
    $('svg').unbind();
}

function unbind_body() {
    $('body').unbind('mouseup');
    $('body').unbind();
}

var Game = function(difficulty) {
    this.ms = 0;
    this.down_timer = null;
    this.finish_time = null;

    var maze_config;
    var self = this;
    switch (difficulty) {
        case "easy": 
            maze_config = random_easy_maze();
            $("#difficultytext").html(": Easy");
            break;
        case "medium": 
            maze_config = random_medium_maze();
            $("#difficultytext").html(": Medium");
            break;
        case "hard": 
            maze_config = random_hard_maze();
            $("#difficultytext").html(": Hard");
            break;
        default:
            $('circle').hide();
            return;
            //maze_config = medium_mazes[0];
    }

    // Counts up. done with the person clicks on the end point.
    this.start_up_timer = function() {
        function pad(val) {
            return val > 9 ? val : "0" + val;
        }
        $("#upscore_parent").show();
        var difficulty_multiplier = get_difficulty_multiplier(self.difficulty);
        self.timer = setInterval(function () {
            document.getElementById("ms").innerHTML = pad(Math.floor(((++self.ms) % 100)));
            document.getElementById("seconds").innerHTML = pad(Math.floor(self.ms / 100) % 60);
            document.getElementById("minutes").innerHTML = pad(Math.floor(self.ms / (60 * 100)));
            $("#upscore").html(difficulty_multiplier * get_upscore(self.ms));
        }, 10);
    }

    this.victory = function() {
        var difficulty_multiplier = get_difficulty_multiplier(self.difficulty);
        $("#upscore").html(difficulty_multiplier * get_upscore(self.finish_time));
        var score = assign_score(self.ms, self.finish_time, self.difficulty);
        unbind_svg();
        unbind_body();
        $('#timer').css('color', 'green');
        $('#visibility').css('fill', 'green');
        $('#player').css('fill', 'blue');
        clearInterval(self.down_timer);
        $('#total_score').show();
        $('#total_score').html('Total score: ' + score);
        self.maze.reveal();

        display_message("Victory! Your score: " + score + ". Click here to play again.");
        bind_click_to_message(function () {
            unbind_message();
            start_game();
        });
    }

    this.out_of_time = function() {
        var difficulty_multiplier = get_difficulty_multiplier(self.difficulty);
        $("#upscore").html(difficulty_multiplier * get_upscore(self.finish_time));
        var score = assign_score(self.ms, self.finish_time, self.difficulty);
        unbind_svg();
        unbind_body();
        $('svg').unbind('mousedown');
        $('svg').unbind('mousemove');
        $('#end').unbind();
        $('#visibility').css('fill', 'red');
        $('#total_score').show();
        $('#total_score').html('Total score: ' + score);
        self.maze.reveal();

        display_message("Time's up! Thanks for playing! Your score: " + score + ". Click here to play again.");
        bind_click_to_message(function() {
            unbind_message();
            start_game();
        });
    }

    // Counts down from the time when the person clicks on the end point.
    // However, the downwards timer is 1.5x faster than the upwards timer, so
    // the player has to get back faster.
    this.start_down_timer = function() {
        function pad(val) {
            return val > 9 ? val : "0" + val;
        }
        var difficulty_multiplier = get_difficulty_multiplier(self.difficulty);
        $("#downscore_parent").show();
        self.down_timer = setInterval(function () {
            if (Math.random() < 0.5) { // 1.5x slower
                self.ms--;
            }
            if (self.ms <= 0) {
                self.out_of_time();
                self.ms = 1;
                clearInterval(self.down_timer);
            }
            document.getElementById("ms").innerHTML = pad(Math.floor(((--self.ms) % 100)));
            document.getElementById("seconds").innerHTML = pad(Math.floor(self.ms / 100) % 60);
            document.getElementById("minutes").innerHTML = pad(Math.floor(self.ms / (60 * 100)));
            $("#downscore").html(difficulty_multiplier * get_downscore(self.finish_time, self.ms));
        }, 10);
    }

    // When the player finds the maze.end.
    // Can either happen when the timer is counting up or down, denoted by the existance of player.countdown.
    this.done_with_maze = function() {
        if (!self.player.countdown) {
            self.player.countdown = true;
            clearInterval(self.timer);
            self.finish_time = self.ms;
            self.start_down_timer(ms);
            $('#timer').css('color', 'red');
            self.player.move_to(self.maze.end.x, self.maze.end.y);
            self.player.draw();
            $("#upscore").html(get_upscore(self.finish_time));
            self.maze.end = self.maze.start;
            self.maze.draw();
        }
        else {
            self.victory();
            $('#end').unbind();
        }
    }

    this.maze = new Maze(maze_config.pointlist);


    this.maze.start = maze_config.start;
    this.maze.end = maze_config.end;

    this.player = new Player(this.maze);
    this.player.move_to(this.maze.start.x, this.maze.start.y);

    $('#end').unbind();
    $('#end').click(function(e) {
        self.done_with_maze();
    });

    function delete_old(elems) {
        elems.forEach(function(elem) {
            elem.remove();
        });
    }
    function copy_visibility(color) {
        color = color || "grey";
        $('#visibility').each(function(index, element) {
            var shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            shape.setAttribute("class", "shadow clickable");
            shape.setAttribute("points", $(this).attr('points'));
            $("svg").prepend(shape);
            setTimeout(function() {
                $(shape).fadeOut("slow");
                setTimeout(function(){shape.remove()}, 500);
            }, 5000)
        });
    }

    // For knowing whether or not to delete the endpoint after unclick
    this.end_in_sight = false;

    function draw_end_if_visible(visibility_polygon) {
        if (!self.end_in_sight) {
            if (point_in_polygon(visibility_polygon, self.maze.end)) {
                $('#end').show()
                self.end_in_sight = true;
            }
        }
    }

    var visibility1;
    var visibility2;
    var visibility3;
    var visibility4;

    // Master polygon - stitched together sub-visibility poly's
    var visibility;

    function draw_visibility() {
        visibility1 = visibility_polygon(self.player, self.maze.polygon, 'visibility');
        if (visibility1.points.length == 0) {
            self.player.angle += 1;
            if (self.player.angle > 360) {
                self.player.angle -= 360;
            }
            // sometimes, angle = NaN. so we just manually fix that. 
            if (!self.player.angle) {
                self.player.angle = 0;
            }
            draw_visibility();
            return;
        }
        self.player.angle = 270;

        visibility2 = visibility_polygon(self.player, self.maze.polygon, 'visibility2');
        self.player.angle -= 90;

        visibility3 = visibility_polygon(self.player, self.maze.polygon, 'visibility3');
        self.player.angle -= 90;

        visibility4 = visibility_polygon(self.player, self.maze.polygon, 'visibility4');
        self.player.angle -= 90;
        self.player.angle += 360;

        visibility = stitch_visibility();
        draw_end_if_visible(visibility);
        visibility.draw();
    }

    // Combines the 4 visibility polygons into one big, real visibility polygon.
    function stitch_visibility() {
        var points = [];
        var polygons = [visibility1, visibility2, visibility3, visibility4];
        polygons.forEach(function(polygon) {
            polygon.points.forEach(function(point) {
                if (are_equal_points(point, self.player.point)) {
                        return;
                    }
                if (point) {
                    points.push([point.x, point.y]);
                }
            });
        });
        return new Polygon('visibility', points);
    }

    // Invariant: point is NOT in polygon
    function closest_point_on_polygon(polygon, point) {
        var retval = polygon.distance_from(point);
        var dist = retval[0];
        var closest_edge = retval[1];
        var closest_pt = retval[2];
        return closest_pt;
    }

    var onclick = function(e) {
        $('.clickable').attr('style', 'cursor: move;');
        dragging = true;
        ondrag(e);
    }
    var ondrag = function(e) {
        if (dragging) {
            var x = e.offsetX;
            var y = e.offsetY;
            var class_string = e.target.getAttribute('class');
            if (class_string && (
                class_string.indexOf('visibility') > -1 || 
                class_string.indexOf('player') > -1
                )) {
                // then we're good
            } else {
                // if we're outside of the polygon, we need to find the closest point
                // on the polygon to x, y AND SET x,y TO THAT
                var closest_point = closest_point_on_polygon(visibility, new Point(x, y));
                x = closest_point.x;
                y = closest_point.y;
            }
            if (!point_in_polygon(self.maze.polygon, new Point(x, y))) {
                return;
            }
            if (is_valid_click(self.player, x, y)) {
                self.player.move_to(x, y);
                self.player.draw();
            }

            copy_visibility();
            self.end_in_sight = false;
            $('#end').hide()
            $('.drawn_point').remove();
            $('line').remove();
            draw_visibility();

            if (point_dist(self.player.point, self.maze.end) < 20) {
                self.done_with_maze();
            }
        }
    };
    var onunclick = function(e) {
        dragging = false;
        $('.clickable').attr('style', 'cursor: click;');
        if (!self.end_in_sight) {
            $('#end').hide();
        }
    }

    this.play = function() {
        $('#downscore_parent').hide();
        $('#total_score').hide();

        self.player.move_to(self.maze.start.x, self.maze.start.y);
        self.player.draw();
        
        draw_visibility();

        $('.clickable').attr('style', 'cursor: click;');
        $('#timer').css('color', 'white');
        dragging = false;
        $('svg').mousedown(onclick)
                .mousemove(ondrag);
        $('body').mouseup(onunclick);
        $('circle').show();
        if (!self.end_in_sight) {
            $('#end').hide();
        }
        self.start_up_timer();
        self.maze.draw(); 
        self.player.draw();
    }

    this.end_game = function() {
        if (self.timer) {
            clearInterval(self.timer);
        }
        if (self.down_timer) {
            clearInterval(self.down_timer);
        }
        dragging = false;
        unbind_svg();
        unbind_body();
        self.ms = 0;
        $('.shadow').remove();
        $('line').remove();
        $('circle').show();
    }
}
