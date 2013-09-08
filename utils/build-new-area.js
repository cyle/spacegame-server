#!/usr/bin/env node

/*

	builds a new area, saves it to mongodb

*/

/*

set:
	- area height
	- area width
	
build:
	- asteroid fields (rectangle or elliptical)
	- asteroid belts (paths)
	- safe zones (rectangle)
	- nebulae (rectangle or elliptical)
	- eventually..
		- space stations (circular)
		- subspace apertures (circular)
		- etc
		
*/

var argv = require('optimist').argv;

if (argv.n == undefined || argv.n == true) {
	console.log('no area name given');
	process.exit(1);
} else {
	console.log('new area name: ' + argv.n);
}

// randomness function, yay
function randomBetween(from, to) {
    return Math.floor(Math.random() * (to-from+1) + from);
}

var Mongolian = require('mongolian'); // mongodb client
var ObjectId =  require('mongolian').ObjectId; // mongodb objectID type
// set up mongodb connection
var mongoserver = new Mongolian('spacegame.com'); // spacegame.com is /etc/host to a local VM
var mdb = mongoserver.db('spacegame'); // the mongodb database called "spacegame"
// use the "areas" collection
var areas = mdb.collection('areas');

// clear areas collection to start fresh
//areas.remove();

/*

	set up the area

*/

var new_area = {}; // this will hold the new area, for saving later
new_area.name = "" + argv.n + ""; // the name of the area
new_area.owner = false; // what civ owns this area? false for none, _id for one
new_area.players = []; // the players currently inhabiting this area
new_area.stuff = []; // this will hold the stuff floating around the area

// set up area limits
if (argv.w == undefined || argv.w == true) {
	new_area.width = 200; // randomize eventually
} else {
	new_area.width = argv.w * 1;
}
if (argv.h == undefined || argv.h == true) {
	new_area.height = 200; // randomize eventually
} else {
	new_area.height = argv.h * 1;
}

/*

	build the area

*/



// make an asteroid field
var asteroid_field_x = 125;
var asteroid_field_y = 65;
var asteroid_field_size = 50;
for (var i = 0; i < 50; i++) {
	var new_asteroid = {};
	new_asteroid.type = 'asteroid';
	new_asteroid.x = randomBetween(asteroid_field_x, asteroid_field_x + asteroid_field_size);
	new_asteroid.y = randomBetween(asteroid_field_y, asteroid_field_y + asteroid_field_size);
	new_asteroid.z = 0;
	new_asteroid.model = { 'type': 'sphere', 'size': randomBetween(1, 3), 'seg': 3, 'color': { 'r': 0.6, 'g': 0.3, 'b': 0.0, 'a': 1.0 } };
	new_area.stuff.push(new_asteroid);
}

// make a safe zone
var new_safezone1 = {};
new_safezone1.type = 'safezone';
new_safezone1.x = 5;
new_safezone1.y = 10;
new_safezone1.z = 0;
new_safezone1.width = 10;
new_safezone1.height = 20;
new_safezone1.depth = 3;
new_area.stuff.push(new_safezone1);

// make a nebula
var new_nebula1 = {};
new_nebula1.type = 'nebula';
new_nebula1.x = 40;
new_nebula1.y = 65;
new_nebula1.z = 0;
new_nebula1.width = 20;
new_nebula1.height = 20;
new_nebula1.depth = 3;
new_area.stuff.push(new_nebula1);

/*

	save it
	
*/

//console.log( new_area );
areas.insert( new_area );

console.log('done');
