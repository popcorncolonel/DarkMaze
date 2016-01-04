var MazeResult = function(score, uptime, downtime) {
    this.score = score;
    this.uptime = uptime;
    this.downtime = downtime;
};

function storageAvailable() {
	try {
		var x = '__storage_test__';
		localStorage.setItem(x, x);
		localStorage.removeItem(x);
		return true;
	}
	catch(e) {
        console.log(e);
		return false;
	}
}

function get_highscore() {
    if (storageAvailable()) {
        var highest_score = localStorage['highest_score'] || 0; // measured in points
        var fastest_up = localStorage['fastest_up'] || 0; // measured in ms
        var fastest_down = localStorage['fastest_down'] || 0; // measured in ms
        return new MazeResult(highest_score, fastest_up, fastest_down);
    }
    else {
        alert('Local storage not enabled on your browser.\nCannot set high score.');
        return {};
    }
}

function set_highscore(score, uptime, downtime) {
    var highest_score = localStorage['highest_score'] || 0; // measured in points
    var fastest_up = localStorage['fastest_up'] || 0; // measured in ms
    var fastest_down = localStorage['fastest_down'] || 0; // measured in ms

    if (score) {
        if (score > highest_score) {
            localStorage['highest_score'] = score;
        }
    }
    if (uptime) {
        if (fastest_up == 0 || uptime < fastest_up) {
            if (uptime != Number.POSITIVE_INFINITY) {
                localStorage['fastest_up'] = uptime;
            }
        }
    }
    if (downtime) {
        if (fastest_down == 0 || downtime < fastest_down) {
            if (downtime != Number.POSITIVE_INFINITY) {
                localStorage['fastest_down'] = downtime;
            }
        }
    }
}

function update_highscore() {
    var highscores = get_highscore();
    $('#highscore').html(highscores.score);
    $('#up_highscore').html(get_timestring(parseInt(highscores.uptime)));
    $('#down_highscore').html(get_timestring(parseInt(highscores.downtime)));
}

$('#reset_scores').click(function() {
    localStorage.removeItem('highest_score');
    localStorage.removeItem('fastest_up');
    localStorage.removeItem('fastest_down');
    update_highscore();
});
