#!/usr/bin/env node

/*

	builds the starting area, saves it to mongodb

*/

var Zone = require('./area-utils.js');
var argv = require('optimist').argv;

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

/*

	set up the area

*/

var new_area = {}; // this will hold the new area, for saving later
new_area.name = "starting area"; // the name of the area
new_area.owner = false; // what civ owns this area? false for none, _id for one
new_area.players = []; // the players currently inhabiting this area
new_area.stuff = []; // this will hold the stuff floating around the area
new_area.width = 500;
new_area.height = 500;

/*

	build the area

*/

// make a space station
var spacestation = {};
spacestation.type = 'space-station';
spacestation.x = new_area.width/2;
spacestation.y = new_area.height/2;
spacestation.z = 0;
spacestation.model = { 'type': 'sphere', 'size': 5, 'seg': 7, 'color': { 'r': 1, 'g': 1, 'b': 1, 'a': 1 } };
new_area.stuff.push(spacestation);

// make an asteroid ring
var asteroid_field_size = 100;
var asteroid_field_center_x = new_area.width/2;
var asteroid_field_center_y = new_area.height/2;
var asteroids = Zone.createAsteroidRing(asteroid_field_center_x, asteroid_field_center_y, asteroid_field_size, asteroid_field_size/2, 0.03, true, true);

for (var i = 0; i < asteroids.length; i++) {
	var new_asteroid = {};
	new_asteroid.type = 'asteroid';
	new_asteroid.x = asteroids[i].x;
	new_asteroid.y = asteroids[i].y;
	new_asteroid.z = 0;
	new_asteroid.model = { 'type': 'sphere', 'size': randomBetween(1, 3), 'seg': 3, 'color': { 'r': 0.6, 'g': 0.3, 'b': 0.0, 'a': 1.0 } };
	new_area.stuff.push(new_asteroid);
}

// make a safe zone
var new_safezone1 = {};
new_safezone1.type = 'safezone';
new_safezone1.x = new_area.width/2;
new_safezone1.y = new_area.height/2;
new_safezone1.z = 0;
new_safezone1.width = 20;
new_safezone1.height = 20;
new_safezone1.depth = 3;
new_area.stuff.push(new_safezone1);

// make a nebula
var new_nebula1 = {};
new_nebula1.type = 'nebula';
new_nebula1.x = new_area.width/2;
new_nebula1.y = 25;
new_nebula1.z = 0;
new_nebula1.width = 50;
new_nebula1.height = 20;
new_nebula1.depth = 3;
new_area.stuff.push(new_nebula1);

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
