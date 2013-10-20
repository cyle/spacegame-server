#!/usr/bin/env node

/*

	builds a new area/zone, saves it to mongodb

*/

var Zone = require('./area-utils.js');
var argv = require('optimist').argv;

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

// randomness function, yay
function randomBetween(from, to) {
    return Math.floor(Math.random() * (1 + to - from) + from);
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
new_area.players = []; // the players currently inhabiting this area
new_area.stuff = []; // this will hold the stuff floating around the area

var possible_area_dimensions = [200, 300, 400, 500, 600]; // how wide or high it could possibly be

// set up area limits
if (argv.w == undefined || argv.w == true) {
	new_area.width = possible_area_dimensions[randomBetween(0, possible_area_dimensions.length-1)];
} else {
	new_area.width = argv.w * 1;
}
if (argv.h == undefined || argv.h == true) {
	new_area.height = possible_area_dimensions[randomBetween(0, possible_area_dimensions.length-1)];
} else {
	new_area.height = argv.h * 1;
}

console.log('dimensions: ' +new_area.width+ 'x' +new_area.height);

/*

	what kind of area is it?

*/

var area_major_types = [ 'deep-space', 'in-system', 'asteroid-field', 'battleground', 'random' ];
var area_major_type = area_major_types[randomBetween(0, area_major_types.length-1)];
area_major_type = 'deep-space';
console.log('area major type: ' + area_major_type);

/*

	more info based on ownership

*/

var area_minor_type = '';

if (new_area.owner != false) {
	// has an owner, okay, so what's the importance of this zone to them?
	var area_minor_types = [ 'major', 'minor', 'colony' ];
	area_minor_type = area_minor_types[randomBetween(0, area_minor_types.length-1)];
} else {
	// pirate or neutral?
	if (randomBetween(0, 100) > 85) {
		area_minor_type = 'pirate';
	} else {
		area_minor_type = 'neutral';
	}
}

console.log('area minor type: ' + area_minor_type);

/*

	build the area

*/

// how much stuff should be in the zone? determine based on total area
var zone_total_area = new_area.width * new_area.height;
var smallest_zone_area = possible_area_dimensions[0] * possible_area_dimensions[0];
var largest_zone_area = possible_area_dimensions[possible_area_dimensions.length-1] * possible_area_dimensions[possible_area_dimensions.length-1];
var objs_in_area_min1 = 4;
var objs_in_area_min2 = 10;
// return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
var objects_in_area = (zone_total_area - smallest_zone_area) * (objs_in_area_min2 - objs_in_area_min1) / (largest_zone_area - smallest_zone_area) + objs_in_area_min1;
objects_in_area = Math.ceil(objects_in_area);
console.log('zone will have at least ' +objects_in_area+ ' things in it...');

var rect_corners = ['tl', 'tr', 'bl', 'br'];

// build subspace apertures
var aperture_chance = randomBetween(0, 100);
if (aperture_chance > 40) {
	// two!
	console.log('subspace apertures: 2');
	
	var aperture1of2 = {};
	aperture1of2.type = 'aperture';
	aperture1of2.z = 0;
	aperture1of2.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	var aperture2of2 = {};
	aperture2of2.type = 'aperture';
	aperture2of2.z = 0;
	aperture2of2.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	
	if (new_area.width > new_area.height) {
		// put them on either end, left and right, decent chance of safe zone
		aperture1of2.x = randomBetween(10, new_area.width/4);
		aperture1of2.y = randomBetween(10, new_area.height - 10);
		aperture2of2.x = randomBetween(new_area.width - new_area.width/4, new_area.width - 10);
		aperture2of2.y = randomBetween(10, new_area.height - 10);
	} else if (new_area.width < new_area.height) {
		// put them on either end, top or bottom, decent chance of safe zone
		aperture1of2.x = randomBetween(10, new_area.width - 10);
		aperture1of2.y = randomBetween(10, new_area.height/4);
		aperture2of2.x = randomBetween(10, new_area.width - 10);
		aperture2of2.y = randomBetween(new_area.height - new_area.height/4, new_area.height - 10);
	} else {
		// put them in corners, decent chance of safe zone
		var first_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
		var second_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
		while (first_corner == second_corner) {
			second_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
		}
		
		switch (first_corner) {
			case 'tl':
			aperture1of2.x = randomBetween(15, new_area.width/6);
			aperture1of2.y = randomBetween(15, new_area.height/6);
			break;
			case 'tr':
			aperture1of2.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
			aperture1of2.y = randomBetween(15, new_area.height/6);
			break;
			case 'bl':
			aperture1of2.x = randomBetween(15, new_area.width/6);
			aperture1of2.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
			break;
			case 'br':
			aperture1of2.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
			aperture1of2.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
			break;
		}
		
		switch (second_corner) {
			case 'tl':
			aperture2of2.x = randomBetween(15, new_area.width/6);
			aperture2of2.y = randomBetween(15, new_area.height/6);
			break;
			case 'tr':
			aperture2of2.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
			aperture2of2.y = randomBetween(15, new_area.height/6);
			break;
			case 'bl':
			aperture2of2.x = randomBetween(15, new_area.width/6);
			aperture2of2.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
			break;
			case 'br':
			aperture2of2.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
			aperture2of2.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
			break;
		}
		
	}
	new_area.stuff.push(aperture1of2);
	new_area.stuff.push(aperture2of2);
	
	// add safe zones
	var apertures_have_safezones = false;
	if (area_major_type == 'battleground') {
		// always add safe zones for battlegrounds
		apertures_have_safezones = true;
	} else {
		if (area_minor_type != 'pirate') { // pirate zones never get safe zones, lol
			if (area_minor_type == 'neutral') {
				// neutral just has a lesser chance
				if (randomBetween(0, 100) > 50) {
					apertures_have_safezones = true;
				}
			} else {
				if (randomBetween(0, 100) > 25) {
					apertures_have_safezones = true;
				}
			}
		}
	}
	
	if (apertures_have_safezones) {
		var aperture1of2_safe = {};
		aperture1of2_safe.type = 'safezone';
		aperture1of2_safe.x = aperture1of2.x;
		aperture1of2_safe.y = aperture1of2.y;
		aperture1of2_safe.z = 0;
		aperture1of2_safe.r = 0;
		aperture1of2_safe.width = 10;
		aperture1of2_safe.height = 10;
		aperture1of2_safe.depth = 3;
		new_area.stuff.push(aperture1of2_safe);
		var aperture2of2_safe = {};
		aperture2of2_safe.type = 'safezone';
		aperture2of2_safe.x = aperture2of2.x;
		aperture2of2_safe.y = aperture2of2.y;
		aperture2of2_safe.z = 0;
		aperture2of2_safe.r = 0;
		aperture2of2_safe.width = 10;
		aperture2of2_safe.height = 10;
		aperture2of2_safe.depth = 3;
		new_area.stuff.push(aperture2of2_safe);
	}
	
} else if (aperture_chance < 40 && aperture_chance > 20) {
	// three!
	console.log('subspace apertures: 3');
	// put them in corners, good chance of safe zone
	var first_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
	var second_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
	while (first_corner == second_corner) {
		second_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
	}
	var third_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
	while (third_corner == first_corner || third_corner == second_corner) {
		third_corner = rect_corners[randomBetween(0, rect_corners.length-1)];
	}
	
	var aperture1of3 = {};
	aperture1of3.type = 'aperture';
	aperture1of3.z = 0;
	aperture1of3.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	var aperture2of3 = {};
	aperture2of3.type = 'aperture';
	aperture2of3.z = 0;
	aperture2of3.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	var aperture3of3 = {};
	aperture3of3.type = 'aperture';
	aperture3of3.z = 0;
	aperture3of3.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	
	switch (first_corner) {
		case 'tl':
		aperture1of3.x = randomBetween(15, new_area.width/6);
		aperture1of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'tr':
		aperture1of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture1of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'bl':
		aperture1of3.x = randomBetween(15, new_area.width/6);
		aperture1of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
		case 'br':
		aperture1of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture1of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
	}
	
	switch (second_corner) {
		case 'tl':
		aperture2of3.x = randomBetween(15, new_area.width/6);
		aperture2of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'tr':
		aperture2of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture2of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'bl':
		aperture2of3.x = randomBetween(15, new_area.width/6);
		aperture2of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
		case 'br':
		aperture2of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture2of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
	}
	
	switch (third_corner) {
		case 'tl':
		aperture3of3.x = randomBetween(15, new_area.width/6);
		aperture3of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'tr':
		aperture3of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture3of3.y = randomBetween(15, new_area.height/6);
		break;
		case 'bl':
		aperture3of3.x = randomBetween(15, new_area.width/6);
		aperture3of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
		case 'br':
		aperture3of3.x = randomBetween(new_area.width - new_area.width/6, new_area.width - 15);
		aperture3of3.y = randomBetween(new_area.height - new_area.height/6, new_area.height - 15);
		break;
	}
	
	new_area.stuff.push(aperture1of3);
	new_area.stuff.push(aperture2of3);
	new_area.stuff.push(aperture3of3);
	
	// add safe zones
	var apertures_have_safezones = false;
	if (area_major_type == 'battleground') {
		// always add safe zones for battlegrounds
		apertures_have_safezones = true;
	} else {
		if (area_minor_type != 'pirate') { // pirate zones never get safe zones, lol
			if (area_minor_type == 'neutral') {
				// neutral just has a lesser chance
				if (randomBetween(0, 100) > 50) {
					apertures_have_safezones = true;
				}
			} else {
				if (randomBetween(0, 100) > 25) {
					apertures_have_safezones = true;
				}
			}
		}
	}
	
	if (apertures_have_safezones) {
		var aperture1of3_safe = {};
		aperture1of3_safe.type = 'safezone';
		aperture1of3_safe.x = aperture1of3.x;
		aperture1of3_safe.y = aperture1of3.y;
		aperture1of3_safe.z = 0;
		aperture1of3_safe.r = 0;
		aperture1of3_safe.width = 10;
		aperture1of3_safe.height = 10;
		aperture1of3_safe.depth = 3;
		new_area.stuff.push(aperture1of3_safe);
		var aperture2of3_safe = {};
		aperture2of3_safe.type = 'safezone';
		aperture2of3_safe.x = aperture2of3.x;
		aperture2of3_safe.y = aperture2of3.y;
		aperture2of3_safe.z = 0;
		aperture2of3_safe.r = 0;
		aperture2of3_safe.width = 10;
		aperture2of3_safe.height = 10;
		aperture2of3_safe.depth = 3;
		new_area.stuff.push(aperture2of3_safe);
		var aperture3of3_safe = {};
		aperture3of3_safe.type = 'safezone';
		aperture3of3_safe.x = aperture3of3.x;
		aperture3of3_safe.y = aperture3of3.y;
		aperture3of3_safe.z = 0;
		aperture3of3_safe.r = 0;
		aperture3of3_safe.width = 10;
		aperture3of3_safe.height = 10;
		aperture3of3_safe.depth = 3;
		new_area.stuff.push(aperture3of3_safe);
	}
	
} else {
	// just one
	console.log('subspace apertures: 1');
	// put it into a random place with a large safe zone
	var aperture = {};
	aperture.type = 'aperture';
	aperture.x = randomBetween(15, new_area.width - 15);
	aperture.y = randomBetween(15, new_area.height - 15);
	aperture.z = 0;
	aperture.model = { 'type': 'sphere', 'size': 3, 'seg': 6, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
	new_area.stuff.push(aperture);
	
	// add safe zone
	var aperture_safe = {};
	aperture_safe.type = 'safezone';
	aperture_safe.x = aperture.x;
	aperture_safe.y = aperture.y;
	aperture_safe.z = 0;
	aperture_safe.r = 0;
	aperture_safe.width = 10;
	aperture_safe.height = 10;
	aperture_safe.depth = 3;
	new_area.stuff.push(aperture_safe);
	
}

if (area_major_type == 'deep-space') {
	
	objects_in_area = randomBetween(objects_in_area, objects_in_area + objects_in_area/2);
	console.log('zone will actually have ' +objects_in_area+ ' things in it');
	
	// lots of dust clouds, nebulae, maybe an asteroid field, etc
	for (var o = 0; o < objects_in_area; o++) {
		var what_type_check = randomBetween(0, 100);
		var asteroids = [];
		if (what_type_check < 20) {
			// asteroid field of some kind
			var field_chance = randomBetween(0, 100);
			if (field_chance > 50) {
				// field
				console.log('+ new asteroid rect field');
				var field_width = randomBetween(30, 60);
				var field_height = randomBetween(30, 60);
				asteroids = Zone.createAsteroidField(randomBetween(field_width/2, new_area.width - field_width/2), randomBetween(field_height/2, new_area.height - field_height/2), field_width, field_height);
			} else if (field_chance <= 50 && field_chance > 20) {
				// circle
				console.log('+ new asteroid circle field');
				var field_radius = randomBetween(15, 30);
				asteroids = Zone.createAsteroidCircle(randomBetween(field_radius/2, new_area.width - field_radius/2), randomBetween(field_radius/2, new_area.height - field_radius/2), field_radius);
			} else if (field_chance <= 20) {
				// ring
				console.log('+ new asteroid ring field');
				var field_radius = randomBetween(15, 30);
				asteroids = Zone.createAsteroidRing(randomBetween(field_radius/2, new_area.width - field_radius/2), randomBetween(field_radius/2, new_area.height - field_radius/2), field_radius, undefined, undefined, randomBetween(0, 1), randomBetween(0, 1));
			}
			
			// deal with asteroids...
			for (var i = 0; i < asteroids.length; i++) {
				var new_asteroid = {};
				new_asteroid.type = 'asteroid';
				new_asteroid.x = asteroids[i].x;
				new_asteroid.y = asteroids[i].y;
				new_asteroid.z = 0;
				// chance to be large?
				// chance to be special/red?
				new_asteroid.model = { 'type': 'sphere', 'size': randomBetween(1, 3), 'seg': 3, 'color': { 'r': 0.6, 'g': 0.3, 'b': 0.0, 'a': 1.0 } };
				new_area.stuff.push(new_asteroid);
			}
			
		} else if (what_type_check >= 20 && what_type_check < 50) {
			// nebula
			console.log('+ new nebula');
			var new_nebula = {};
			new_nebula.type = 'nebula';
			new_nebula.width = randomBetween(10, 30);
			new_nebula.height = randomBetween(10, 30);
			new_nebula.x = randomBetween(new_nebula.width/2, new_area.width - new_nebula.width/2);
			new_nebula.y = randomBetween(new_nebula.height/2, new_area.height - new_nebula.height/2);
			new_nebula.z = 0;
			new_nebula.r = 0;
			new_nebula.depth = 3;
			new_area.stuff.push(new_nebula);
		} else {
			// dust cloud
			console.log('+ new dust cloud');
			var new_dustcloud = {};
			new_dustcloud.type = 'dust-cloud';
			new_dustcloud.width = randomBetween(10, 30);
			new_dustcloud.height = randomBetween(10, 30);
			new_dustcloud.x = randomBetween(new_dustcloud.width/2, new_area.width - new_dustcloud.width/2);
			new_dustcloud.y = randomBetween(new_dustcloud.height/2, new_area.height - new_dustcloud.height/2);
			new_dustcloud.z = 0;
			new_dustcloud.r = 0;
			new_dustcloud.depth = 3;
			new_area.stuff.push(new_dustcloud);
		}
	}
	
} else if (area_major_type == 'in-system') {
	
	// add a star, or a planet, or something like that, with asteroids and dust clouds
	
} else if (area_major_type == 'asteroid-field') {
	
	// lots of asteroids and dust clouds everywhere, maybe a nebula or two
	
} else if (area_major_type == 'battleground') {
	
	// split the zone up into two or three or four major areas, with nebula and asteroid fields separating them
	
} else if (area_major_type == 'random') {
	
	// do whatever i guess, like rogue trader
	for (var i = 0; i < objects_in_area; i++) {
		
	}
	
} else {
	// uhhh...?
	console.log('uhhh dunno the areas major type, weird');
	process.exit(1);
}

// make an asteroid field
//var asteroid_field_size = new_area.width * 0.4;
//var asteroid_field_center_x = randomBetween(asteroid_field_size/2, new_area.width - asteroid_field_size/2);
//var asteroid_field_center_y = randomBetween(asteroid_field_size/2, new_area.height - asteroid_field_size/2);
//var asteroids = Zone.createAsteroidField(asteroid_field_center_x, asteroid_field_center_y, asteroid_field_size, asteroid_field_size);
//var asteroids = Zone.createAsteroidCircle(new_area.width/2, new_area.height/2, asteroid_field_size, { x: 50, y: 50, r: 50 });
//var asteroids = Zone.createAsteroidRing(new_area.width/2, new_area.height/2, asteroid_field_size, undefined, undefined, true, true);
//var asteroids = Zone.createAsteroidBelt(randomBetween(10, new_area.width - 10), randomBetween(10, new_area.height - 10), new_area.width, new_area.height, randomBetween(20, 50), new_area.width/7);

// ok, now use the asteroids
// for (var i = 0; i < asteroids.length; i++) {
// 	var new_asteroid = {};
// 	new_asteroid.type = 'asteroid';
// 	new_asteroid.x = asteroids[i].x;
// 	new_asteroid.y = asteroids[i].y;
// 	new_asteroid.z = 0;
// 	// chance to be large?
// 	// chance to be special/red?
// 	new_asteroid.model = { 'type': 'sphere', 'size': randomBetween(1, 3), 'seg': 3, 'color': { 'r': 0.6, 'g': 0.3, 'b': 0.0, 'a': 1.0 } };
// 	new_area.stuff.push(new_asteroid);
// }

// make a safe zone
// var new_safezone1 = {};
// new_safezone1.type = 'safezone';
// new_safezone1.x = 5;
// new_safezone1.y = 10;
// new_safezone1.z = 0;
// new_safezone1.width = 10;
// new_safezone1.height = 20;
// new_safezone1.depth = 3;
// new_area.stuff.push(new_safezone1);

// make a nebula
// var new_nebula1 = {};
// new_nebula1.type = 'nebula';
// new_nebula1.x = 40;
// new_nebula1.y = 65;
// new_nebula1.z = 0;
// new_nebula1.width = 20;
// new_nebula1.height = 20;
// new_nebula1.depth = 3;
// new_area.stuff.push(new_nebula1);

// make a space station
// var spacestation = {};
// spacestation.type = 'space-station';
// spacestation.x = new_area.width/2;
// spacestation.y = new_area.height/2;
// spacestation.z = 0;
// spacestation.model = { 'type': 'sphere', 'size': 5, 'seg': 7, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
// new_area.stuff.push(spacestation);

/*

	save it
	
*/

//console.log( new_area );
areas.insert( new_area, function(err, val) {
	if (err) { console.log(err); return; }
	console.log('new area ID: ' + val['_id'] + '');
	console.log('done');
	process.exit();
} );
