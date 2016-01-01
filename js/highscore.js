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
        return {
            highest_score: highest_score,
            fastest_up: fastest_up,
            fastest_down: fastest_down,
        }
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

    if (score > highest_score) {
        localStorage['highest_score'] = score;
    }
    if (fastest_up == 0 || uptime < fastest_up) {
        if (uptime != Number.POSITIVE_INFINITY) {
            localStorage['fastest_up'] = uptime;
        }
    }
    if (fastest_down == 0 || downtime < fastest_down) {
        if (downtime != Number.POSITIVE_INFINITY) {
            localStorage['fastest_down'] = downtime;
        }
    }
}

function update_highscore() {
    var highscores = get_highscore();
    $('#highscore').html(highscores.highest_score);
    $('#up_highscore').html(get_timestring(parseInt(highscores.fastest_up)));
    $('#down_highscore').html(get_timestring(parseInt(highscores.fastest_down)));
}

