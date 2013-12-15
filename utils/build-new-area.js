#!/usr/bin/env node

/*

	builds a new area/zone, saves it to mongodb

*/

var Zone = require('./area-utils.js');
var argv = require('optimist').argv;
var PerlinGenerator = require("proc-noise");
var Perlin = new PerlinGenerator();

if (argv.n == undefined || argv.n == true) {
	console.log('no area name given, set with -n');
	process.exit(1);
} else {
	console.log('new area name: ' + argv.n);
}

if (argv.n == 'starting area') {
	console.log('you cannot set the area name to \'starting area\'');
	process.exit(1);
}

// helper function for making a random float. obviously.
function randomFloat(min, max) {
	return min + (max - min) * Math.random();
}

// helper function for making a random int (inclusive). obviously.
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// set up mongodb connection
var Mongolian = require('mongolian'); // mongodb client
var ObjectId =  require('mongolian').ObjectId; // mongodb objectID type
var mongoserver = new Mongolian('spacegame.com'); // spacegame.com is /etc/hosts to a local VM
var mdb = mongoserver.db('spacegame'); // the mongodb database called "spacegame"
var areas = mdb.collection('areas');

/*

	set up the area

*/

var new_area = {}; // this will hold the new area, for saving later
new_area.name = "" + argv.n + ""; // the name of the area
new_area.owner = false; // what civ owns this area? false for none, _id for one
new_area.players = new Array(); // the players currently inhabiting this area
new_area.tiles = new Array(); // this will hold the "tiles" that'll help determine the stuff floating around
new_area.stuff = new Array(); // this will hold the stuff floating around the area

var possible_area_dimensions = [200, 300, 400, 500, 600]; // how wide or high it could possibly be

// set up area limits
if (argv.w == undefined || argv.w == true) {
	new_area.width = possible_area_dimensions[randomInt(0, possible_area_dimensions.length-1)];
} else {
	new_area.width = argv.w * 1;
}
if (argv.h == undefined || argv.h == true) {
	new_area.height = possible_area_dimensions[randomInt(0, possible_area_dimensions.length-1)];
} else {
	new_area.height = argv.h * 1;
}

console.log('full dimensions: ' +new_area.width+ 'x' +new_area.height);


// set up tile dimensions
new_area.tile_size = 10; // this should be able to evenly divide the width and height
new_area.tiles_wide = new_area.width/new_area.tile_size;
new_area.tiles_tall = new_area.height/new_area.tile_size;

console.log('tile dimensions: ' +new_area.tiles_wide+ 'x' +new_area.tiles_tall);

/*
	noise scale... the lower it is, the more smooth it'll be
	- below 0.08, it gets really smooth
	- above 0.18, it gets really chunky
	but this all depends on how you're using it!
*/

var noise_scale = 0; // this will get used later
var noise_min = 0.08;
var noise_max = 0.18;
new_area.noise_scale = randomFloat(noise_min, noise_max);

console.log('noise scale is ' + new_area.noise_scale);

/*

	what kind of area is it?

*/

var area_major_types = [ 'deep-space', 'in-system', 'asteroid-field', 'battleground', 'random' ];
new_area.major_type = area_major_types[randomInt(0, area_major_types.length-1)];
console.log('area major type: ' + new_area.major_type);

/*

	more info based on ownership

*/

if (new_area.owner != false) {
	// has an owner, okay, so what's the importance of this zone to them?
	var area_minor_types = [ 'major', 'minor', 'colony' ];
	new_area.minor_type = area_minor_types[randomInt(0, area_minor_types.length-1)];
} else {
	// pirate or neutral?
	if (randomInt(0, 100) > 85) {
		new_area.minor_type = 'pirate';
	} else {
		new_area.minor_type = 'neutral';
	}
}

console.log('area minor type: ' + new_area.minor_type);

/*

	okay -- build it -- first, make a tile map

*/

for (var x = 0; x < new_area.tiles_wide; x++) {
	new_area.tiles[x] = new Array();
	for (var y = 0; y < new_area.tiles_tall; y++) {
		var new_tile = {};
		new_tile.type = "unknown";
		var nv = Perlin.noise(x * new_area.noise_scale, y * new_area.noise_scale);
		new_tile.noiseval = nv;
		if (new_area.major_type == "random") {
			if (nv <= 0.15) {
				new_tile.type = "ion-storm";
			} else if (nv > 0.15 && nv <= 0.3) {
				new_tile.type = "nebula";
			} else if (nv > 0.3 && nv < 0.65) {
				new_tile.type = "open-space";
			} else if (nv >= 0.65 && nv < 0.7) {
				new_tile.type = "dust-cloud";
			} else if (nv >= 0.7) {
				new_tile.type = "asteroids";
			}
		} else if (new_area.major_type == "deep-space") {
			if (nv <= 0.2) {
				new_tile.type = "ion-storm";
			} else if (nv > 0.2 && nv <= 0.3) {
				new_tile.type = "nebula";
			} else if (nv > 0.3 && nv < 0.7) {
				new_tile.type = "open-space";
			} else if (nv >= 0.7 && nv < 0.85) {
				new_tile.type = "dust-cloud";
			} else if (nv >= 0.85) {
				new_tile.type = "asteroids";
			}
		} else if (new_area.major_type == "asteroid-field") {
			if (nv <= 0.05) {
				new_tile.type = "ion-storm";
			} else if (nv > 0.05 && nv <= 0.2) {
				new_tile.type = "nebula";
			} else if (nv > 0.2 && nv < 0.45) {
				new_tile.type = "open-space";
			} else if (nv >= 0.45 && nv < 0.55) {
				new_tile.type = "dust-cloud";
			} else if (nv >= 0.55) {
				new_tile.type = "asteroids";
			}
		} else if (new_area.major_type == "in-system") {
			
			// make planetoid types...?
			
			if (nv <= 0.1) {
				new_tile.type = "nebula";
			} else if (nv > 0.1 && nv < 0.6) {
				new_tile.type = "open-space";
			} else if (nv >= 0.6 && nv < 0.75) {
				new_tile.type = "dust-cloud";
			} else if (nv >= 0.75) {
				new_tile.type = "asteroids";
			}
		} else if (new_area.major_type == "battleground") {
			// determine asteroid "chance" based on noise function and how close to center we are
			var asteroid_chance = 0;
			if (x == new_area.tiles_wide/2 || x == (new_area.tiles_wide/2) - 1 || x == (new_area.tiles_wide/2) + 1) {
				asteroid_chance = nv;
			} else if (x < new_area.tiles_wide/2) {
				asteroid_chance = (x/(new_area.tiles_wide/2)) * nv;
			} else if (x > new_area.tiles_wide/2) {
				asteroid_chance = ((new_area.tiles_wide - x)/(new_area.tiles_wide/2)) * nv;
			}
			// based on asteroid chance, set up battleground
			if (asteroid_chance > 0.3 && asteroid_chance < 0.35) {
				new_tile.type = "dust-cloud";
			} else if (asteroid_chance > 0.35 && asteroid_chance < 0.6) {
				new_tile.type = "asteroids";
			} else {
				new_tile.type = "open-space";
			}
		}
		new_tile.station = false;
		new_tile.aperture = false;
		new_area.tiles[x][y] = new_tile;
	}
}

/*
	
	add space stations and fast-travel apertures

*/

// do stations and apertures differently for battlegrounds...
if (new_area.major_type == "battleground") {
	// left side -- make sure station and aperture are in open space
	var left_station_tile = new_area.tiles[randomInt(3, new_area.tiles_wide/2 - 10)][randomInt(1, new_area.tiles_tall-2)];
	if (left_station_tile.type == "open-space") {
		left_station_tile.station = true;
	} else {
		while (left_station_tile.type != "open-space") {
			left_station_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		}
		left_station_tile.station = true;
	}
	var left_aperture_tile = new_area.tiles[randomInt(3, new_area.tiles_wide/2 - 10)][randomInt(1, new_area.tiles_tall-2)];
	if (left_aperture_tile.type == "open-space") {
		left_aperture_tile.aperture = true;
	} else {
		while (left_aperture_tile.type != "open-space") {
			left_aperture_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		}
		left_aperture_tile.aperture = true;
	}
	// right side -- make sure station and aperture are in open space
	var right_station_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
	if (right_station_tile.type == "open-space") {
		right_station_tile.station = true;
	} else {
		while (right_station_tile.type != "open-space") {
			right_station_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		}
		right_station_tile.station = true;
	}
	var right_aperture_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
	if (right_aperture_tile.type == "open-space") {
		right_aperture_tile.aperture = true;
	} else {
		while (right_aperture_tile.type != "open-space") {
			right_aperture_tile = new_area.tiles[randomInt(new_area.tiles_wide/2 + 10, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		}
		right_aperture_tile.aperture = true;
	}
	
} else {
	// choose a random number of stations
	var num_stations = randomInt(1, 3);
	for (var i = 0; i < num_stations; i++) {
		var rand_tile = new_area.tiles[randomInt(1, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		//if (rand_tile.type == 'open-space' || rand_tile.type == 'asteroids') {
		if (rand_tile.type == 'open-space') {
			rand_tile.station = true;
		} else {
			i--; // go back, try again
		}
	}
	// choose random number of apertures
	var num_apertures = randomInt(1, 2);
	for (var i = 0; i < num_apertures; i++) {
		var rand_tile = new_area.tiles[randomInt(1, new_area.tiles_wide-2)][randomInt(1, new_area.tiles_tall-2)];
		if (rand_tile.type == 'open-space' && rand_tile.station == false) {
			rand_tile.aperture = true;
		} else {
			i--; // go back, try again
		}
	}
}

/*

	add things like planetoids (for in-system), wormholes...?

*/





/*

	add stuff floating around based on tiles

*/

for (var x = 0; x < new_area.tiles_wide; x++) {
	for (var y = 0; y < new_area.tiles_tall; y++) {
		
		var this_tile = new_area.tiles[x][y];
		var this_tile_tl_x = x * new_area.tile_size;
		var this_tile_tl_y = y * new_area.tile_size;
		var this_tile_center_x = (x * new_area.tile_size) + (new_area.tile_size/2);
		var this_tile_center_y = (y * new_area.tile_size) + (new_area.tile_size/2);
		
		if (this_tile.type == 'asteroids') {
			// make asteroid field
			var asteroids = Zone.createAsteroidField(this_tile_center_x, this_tile_center_y, new_area.tile_size, new_area.tile_size);
			// deal with asteroids...
			for (var i = 0; i < asteroids.length; i++) {
				var new_asteroid = {};
				new_asteroid.type = 'asteroid';
				new_asteroid.x = asteroids[i].x;
				new_asteroid.y = asteroids[i].y;
				new_asteroid.z = 0;
				// chance to be large?
				// chance to be special/red?
				new_asteroid.model = { 'type': 'sphere', 'size': randomInt(1, 3), 'seg': 3, 'color': { 'r': 0.6, 'g': 0.3, 'b': 0.0, 'a': 1.0 } };
				new_area.stuff.push(new_asteroid);
			}
		} else if (this_tile.type == 'nebula') {
			// make nebula area
			var new_nebula = {};
			new_nebula.type = 'nebula';
			new_nebula.width = new_area.tile_size;
			new_nebula.height = new_area.tile_size;
			new_nebula.x = this_tile_center_x;
			new_nebula.y = this_tile_center_y;
			new_nebula.z = 0;
			new_nebula.r = 0;
			new_nebula.depth = 3;
			new_area.stuff.push(new_nebula);
		} else if (this_tile.type == 'ion-storm') {
			// make ion storm area
			var new_ionstorm = {};
			new_ionstorm.type = 'ion-storm';
			new_ionstorm.width = new_area.tile_size;
			new_ionstorm.height = new_area.tile_size;
			new_ionstorm.x = this_tile_center_x;
			new_ionstorm.y = this_tile_center_y;
			new_ionstorm.z = 0;
			new_ionstorm.r = 0;
			new_ionstorm.depth = 3;
			new_area.stuff.push(new_nebula);
		} else if (this_tile.type == 'dust-cloud') {
			// make dust cloud area
			var new_dustcloud = {};
			new_dustcloud.type = 'dust-cloud';
			new_dustcloud.width = new_area.tile_size;
			new_dustcloud.height = new_area.tile_size;
			new_dustcloud.x = this_tile_center_x;
			new_dustcloud.y = this_tile_center_y;
			new_dustcloud.z = 0;
			new_dustcloud.r = 0;
			new_dustcloud.depth = 3;
			new_area.stuff.push(new_dustcloud);
		} else if (this_tile.hasOwnProperty('aperture') && this_tile.aperture == true) {
			// add aperture somewhere in this area, maybe a safe zone around it
			var aperture = {};
			aperture.type = 'aperture';
			aperture.x = randomInt(this_tile_tl_x, this_tile_tl_x + new_area.tile_size);
			aperture.y = randomInt(this_tile_tl_y, this_tile_tl_y + new_area.tile_size);
			aperture.z = 0;
			aperture.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
			new_area.stuff.push(aperture);
			if (new_area.major_type == 'battleground' || new_area.minor_type == 'major' || (new_area.minor_type == 'colony' && randomInt(0, 100) > 50) || (new_area.minor_type == 'neutral' && randomInt(0, 100) > 50) || (new_area.minor_type == 'minor' && randomInt(0, 100) > 70)) {
				var aperture_safe = {};
				aperture_safe.type = 'safezone';
				aperture_safe.x = this_tile_center_x;
				aperture_safe.y = this_tile_center_y;
				aperture_safe.z = 0;
				aperture_safe.r = randomFloat(0, (Math.PI * 2));
				aperture_safe.width = new_area.tile_size;
				aperture_safe.height = new_area.tile_size;
				aperture_safe.depth = 3;
				new_area.stuff.push(aperture_safe);
			}
		} else if (this_tile.hasOwnProperty('station') && this_tile.station == true) {
			// add station and maybe safe zone in this area
			var spacestation = {};
			spacestation.type = 'space-station';
			spacestation.x = randomInt(this_tile_tl_x, this_tile_tl_x + new_area.tile_size);
			spacestation.y = randomInt(this_tile_tl_y, this_tile_tl_y + new_area.tile_size);
			spacestation.z = 0;
			spacestation.model = { 'type': 'sphere', 'size': 5, 'seg': 7, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
			new_area.stuff.push(spacestation);
			if (new_area.major_type == 'battleground' || new_area.minor_type == 'major' || (new_area.minor_type == 'colony' && randomInt(0, 100) > 50) || (new_area.minor_type == 'neutral' && randomInt(0, 100) > 50) || (new_area.minor_type == 'minor' && randomInt(0, 100) > 70)) {
				var station_safe = {};
				station_safe.type = 'safezone';
				station_safe.x = this_tile_center_x;
				station_safe.y = this_tile_center_y;
				station_safe.z = 0;
				station_safe.r = randomFloat(0, (Math.PI * 2));
				station_safe.width = new_area.tile_size;
				station_safe.height = new_area.tile_size;
				station_safe.depth = 3;
				new_area.stuff.push(station_safe);
			}
		}
		
	}
}

/*

	all done -- save it!

*/

//console.log( new_area );

areas.insert( new_area, function(err, val) {
	if (err) { console.log(err); return; }
	console.log('new area ID: ' + val['_id'] + '');
	console.log('done');
	process.exit();
} );
