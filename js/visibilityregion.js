

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
    maze.start = maze.points[maze.points.length-1];
    maze.end = maze.points[14];
    maze.scale(1.35);
    maze.draw();

    var player = new Player(maze);
    player.draw();

    $('#maze').click(function(e) {
        var x = e.offsetX;
        var y = e.offsetY;
        player.move_to(x, y);
        player.draw();
    });
}

main();

