/*

	the SPACE GAME! server, for multiplayer

*/

console.log('SPACE GAME! server, revving up...');

// load the external requirements
var Mongolian = require('mongolian'); // mongodb client
var ObjectId =  require('mongolian').ObjectId; // mongodb objectID type
var sigil = require('sigil'); // my graph database client

// set up mongodb connection
var mongoserver = new Mongolian('spacegame.com'); // spacegame.com is /etc/host to a local VM
var mdb = mongoserver.db('spacegame'); // the mongodb database called "spacegame"
var players_db = mdb.collection('players');
var areas_db = mdb.collection('areas');

// get it going
var app = require('http').createServer(handler); // make the new HTTP server
var io = require('socket.io').listen(app); // this is the magic
io.enable('browser client minification'); // send minified client
io.enable('browser client etag'); // apply etag caching logic based on version number
io.enable('browser client gzip'); // gzip the file
io.set('log level', 1); // only WARN-level log notices, please
app.listen(31777); // load it up on this port
console.log('listening on port 31777...');

// do not serve anything over http
function handler(req, res) {
	res.writeHead(500);
    res.end('Nope.');
}

/*

	helper functions

*/

function signTriangle(p1, p2, p3) {
	return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

// triangle vertex 1, vertex 2, vertex 3, point to check
function pointInsideTriangle(v1, v2, v3, pt) {
	var b1 = signTriangle(pt, v1, v2) < 0;
	var b2 = signTriangle(pt, v2, v3) < 0;
	var b3 = signTriangle(pt, v3, v1) < 0;
	return ((b1 == b2) && (b2 == b3));
}

// rect center X, rect center Y, rect width, rect height, rect rotation (radians), point X, point Y
function pointInsideRotatedRect(rx, ry, rw, rh, rot, px, py) {
	var dx = px - rx;
	var dy = py - ry;
	var h1 = Math.sqrt( (dx * dx) + (dy * dy) );
	var currA = Math.atan2(dy, dx);
	var newA = currA - rot;
	var x2 = Math.cos(newA) * h1;
	var y2 = Math.sin(newA) * h1;
	if (x2 > -0.5 * rw && x2 < 0.5 * rw && y2 > -0.5 * rh && y2 < 0.5 * rh) {
		return true;
	} else {
		return false;
	}
}

// rect center X, rect center Y, rect width, rect height, point X, point Y
function pointInsideRectangle(rx, ry, rw, rh, px, py) {
	var top = ry + rh/2;
	var right = rx + rw/2;
	var bottom = ry - rh/2;
	var left = rx - rw/2;
	if (px > right || px < left) {
		return false;
	} else if (py > top || py < bottom) {
		return false
	} else {
		if (px > left && px < right && py > bottom && py < top) {
			return true;
		} else {
			return false;
		}
	}
}

function pointInsideCircle(cx, cy, r, px, py) {
	var square_dist = Math.pow((cx - px), 2) + Math.pow((cy - py), 2);
	if (square_dist <= Math.pow(r, 2)) {
		return true;
	} else {
		return false;
	}
}

function randomInt(min, max) { // inclusive
	if (max == undefined) { // assume it's between 0 and whatever
		return Math.floor(Math.random() * (min + 1));
	} else {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

function randomFloat(min, max) {
	if (max == undefined) { // assume it's between 0 and whatever
		return Math.random() * min;
	} else {
		return Math.random() * (max - min) + min;
	}
}

function valueInArray(needle, haystack) {
	for (var i = 0; i < haystack.length; i++) {
		if (haystack[i] == needle) {
			return true;
		}
	}
	return false;
}

function degreesToRadians(degrees) {
	return degrees * (Math.PI/180);
}

function radiansToDegrees(radians) {
	return radians * (180/Math.PI);
}

/*

	current state data

*/

// this will hold onto all areas by ID
var areas = [];

// this will hold onto all area IDs that contain players
var active_areas = [];

// this will hold onto all current players
var players = [];

// this will hold onto all current bullets
var bullets = [];

// this will hold into all current salvageable objects
var salvages = [];

// get whatever the ID for the starting area is
var starting_area_id = undefined;
areas_db.findOne({ 'name': 'starting area' }, function(err, area_record) {
	starting_area_id = area_record['_id'];
	console.log('starting area _id is: ' + starting_area_id);
});


/*

	deal with player connections

*/

io.sockets.on('connection', function(socket) {
	
	// on new connection, make a new player object for them
	var player = new Player();
	
	// log the new player
	console.log('player connected');
	
	socket.on('connected', function(name) { // the client tells us they're connected and who they are
		
		var player_found = false;
		
		// check to see if the name exists already
		for (var i = 0; i < players; i++) {
			if (players[i].name == name) { // if so, send along their info
				player = players[i];
				socket.join(player.area); // join the zone they're in
				if (valueInArray(player.area, active_areas) == false) { active_areas.push(player.area); } // add area to tracked areas
				socket.emit('welcome', player);
				socket.broadcast.volatile.to(player.area).emit('updatePlayer', player);
				player_found = true;
			}
		}
		
		if (player_found == false) {
			// if not, see if they are in the database
			players_db.findOne({ 'name': name }, function(err, playerRecord) {
				if (err) { console.log(err); return; }
				player = new Player(); // set up new player object
				if (playerRecord != undefined) {
					// player found in database -- use that info
					console.log('returning player!');
					player.name = playerRecord.name;
					player.x = playerRecord.position.x;
					player.y = playerRecord.position.y;
					player.angle = playerRecord.position.angle;
					player.area = '' + playerRecord.position.area + '';
					player.objID = '' + playerRecord['_id'] + '';
				} else {
					// player NOT found... create new
					console.log('new player!');
					player.name = name;
					player.area = starting_area_id; // starting area mongodb ID
					player.x = 233;
					player.y = 245;
					var newplayer_doc = { 'name': name, 'position': { 'x': player.x, 'y': player.y, 'z': 0, 'angle': 0, 'area': player.area } };
					players_db.insert(newplayer_doc);
					player.objID = '' + newplayer_doc['_id'] + ''; // their new mongodb ID
					console.log('new player ID: ' + player.objID);
					areas_db.update( {'name': 'starting area'}, {'$push': { 'players': newplayer_doc['_id'] } } );
				}
				console.log(player); // current player
				// add new player to array of players
				players.push(player);
				socket.join(player.area); // join the zone they're in
				if (valueInArray(player.area, active_areas) == false) { active_areas.push(player.area); } // add area to tracked areas
				socket.emit('welcome', player);
				socket.broadcast.volatile.to(player.area).emit('updatePlayer', player); // send to all players this new player's attributes
			});
		}
		
	});
	
	// fetch current area data when player asks for it
	socket.on('get-current-area-extra', function() {
		
		// send stuff that's only relevant to the player's current area
		
		console.log('was just asked by '+player.name+' in area '+player.area+' for current area extra info');
		
		// send along other players in the same area
		if (players.length > 0) { // if there's more than one other player...
			var players_in_same_area = [];
			for (var i = 0; i < players.length; i++) {
				if (players[i].name == player.name) {
					continue;
				}
				if (players[i].area == player.area) {
					players_in_same_area.push(players[i]);
				}
			}
			socket.emit('otherPlayers', players_in_same_area); // give the new player the other players
		}
		
		// send along salvages in this area
		if (salvages.length > 0) {
			for (var i = 0; i < salvages.length; i++) {
				if (salvages[i].area == player.area) {
					socket.emit('newSalvage', { id: salvages[i].id, x: salvages[i].x, y: salvages[i].y });
				}
			}
		}
		
	});
	
	// fetch the player's current area
	socket.on('get-current-area', function() {
		var player_objID = new ObjectId(player.objID);
		areas_db.findOne({ 'players': player_objID }, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find where the current player is'); return; }
			if (areas[''+areaRecord['_id']+''] == undefined) { areas[''+areaRecord['_id']+''] = areaRecord; } // if area not being tracked yet, track it
			socket.emit('current-area-data', areaRecord);
		});
	});
	
	// fetch and send full data about an area based on given ID
	socket.on('get-area-by-id', function(area_id) {
		var area_objID = new ObjectId(area_id);
		areas_db.findOne({ '_id': area_objID }, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find an area with the ID ' + area_id); return; }
			socket.emit('area-data', areaRecord);
		});
	});
	
	// fetch and send full data about an area based on given name
	socket.on('get-area-by-name', function(area_name) {
		areas_db.findOne({ 'name': area_name }, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find an area with the name ' + area_name); return; }
			socket.emit('area-data', areaRecord);
		});
	});
	
	// if the player disconnects, tell everyone so they can stop rendering them
	socket.on('disconnect', function() {
		// update the database with their last known location
		players_db.update( { 'name': player.name }, { '$set': { 'position.x': player.x, 'position.y': player.y, 'position.angle': player.angle } } );
		console.log('player left: ' + player.name);
		socket.broadcast.to(player.area).emit('removePlayer', player.name); // tell everyone the player is gone
		removePlayer(player); // stop tracking the player on the server side
	});
	
	// when a player moves, let everyone know
	var moveCounter = 0;
	var maxMovesBeforeUpdate = 120; // this equates to once every two seconds or so
	socket.on('move', function (data) {
		if (data.x == null || data.y == null || data.angle == null || data.direction == null) {
			return;
		}
		//console.log(data);
		player.updatePosition(data.x, data.y, data.angle, data.direction); // update the player's position
		
		if (data.state == 'invisible') {
			//console.log('player ' + player.name + ' has gone invisible!');
			socket.broadcast.to(player.area).emit('removePlayer', player.name); // player is invisible -- remove them!
		} else {
			//console.log('player ' + player.name + ' moved!');
			socket.broadcast.to(player.area).volatile.emit('updatePlayer', player); // send this updated player data out to other clients
		}
		
		// update the server-side array of players
		for (i = 0; i < players.length; i++) {
			if (players[i].name == player.name) {
				players[i].updatePosition(data.x, data.y, data.angle, data.direction);
			}
		}
		moveCounter++;
		if (moveCounter == maxMovesBeforeUpdate) {
			//console.log('updating ' + player.name + ' location in database');
			//console.log(data);
			// update the database
			players_db.update( { 'name': player.name }, { '$set': { 'position.x': data.x, 'position.y': data.y, 'position.angle': data.angle } } );
			moveCounter = 0;
		}
	}); // end move update
	
	// when a player fires, keep track of the bullet
	socket.on('fired', function (data) {
		console.log('player ' + player.name + ' fired weapon type ' + data.weaponType + ' in area ' + player.area);
		bullets.push( new Bullet(player.area, player.x, player.y, player.angle, data.weaponType, player.name) );
	});
	
	// when a player tries to salvage, see if they find anything
	socket.on('salvage', function() {
		console.log('player '+player.name+' trying to salvage object in area ' + player.area);
		//console.log('players x: '+player.x+', y: '+player.y+', angle: ' + player.angle)
		// create the triangle of salvage-able area in front of the player
		var salvageAngle = 60; // this is the angle of the salvage emitter
		var salvageDistance = 5; // this is the max distance ahead
		//var salvageTriangleSide = Math.cos( degreesToRadians(salvageAngle)/2 ) * salvageDistance;
		var point1 = { x: player.x, y: player.y }; // the player center
		var point2 = {};
		point2.x = point1.x + (Math.sin(player.angle + degreesToRadians(salvageAngle)/2) * -salvageDistance);
		point2.y = point1.y + (Math.cos(player.angle + degreesToRadians(salvageAngle)/2) * salvageDistance);
		var point3 = {};
		point3.x = point1.x + (Math.sin(player.angle - degreesToRadians(salvageAngle)/2) * -salvageDistance);
		point3.y = point1.y + (Math.cos(player.angle - degreesToRadians(salvageAngle)/2) * salvageDistance);
		// point inside triangle algorithm: http://stackoverflow.com/questions/2049582/how-to-determine-a-point-in-a-triangle
		//socket.emit('salvage-response', { a: point1, b: point2, c: point3 });
		for (var i = 0; i < salvages.length; i++) {
			if (salvages[i].area == player.area && pointInsideTriangle(point1, point2, point3, { x: salvages[i].x, y: salvages[i].y })) {
				console.log('player '+player.name+' salvaged id #' + salvages[i].id);
				socket.emit('salvaged', { id: salvages[i].id });
				io.sockets.in(salvages[i].area).emit('removeSalvage', { id: salvages[i].id });
				salvages.splice(i, 1); // remove from the array of salvages
			}
		}
	});
	
	// player is jumping to a new area!
	socket.on('area-jump', function(data) {
		console.log('player '+player.name+' is trying to make a subspace jump!');
		console.log(data);
		var area_query = {};
		if (data.name != undefined) {
			area_query = { 'name': data.name };
		} else if (data.id != undefined) {
			area_query = { '_id': new ObjectId(data.id) };
		} else {
			console.log('error: user supplied no means of finding what area to jump to.');
			return;
		}
		areas_db.findOne(area_query, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find the queried area'); return; }
			console.log('player '+player.name+' jump successful');
			// remove the player from their current mongodb area record location
			areas_db.update({'_id': new ObjectId(player.area) }, {'$pull': { 'players': new ObjectId(player.objID) } });
			socket.broadcast.to(player.area).emit('removePlayer', player.name); // tell everyone the player is gone
			socket.leave(player.area);
			// add the player to the new mongodb area record location
			areas_db.update({'_id': areaRecord['_id'] }, {'$push': { 'players': new ObjectId(player.objID) } });
			player.area = '' + areaRecord['_id'] + ''; // update the server's active player record
			player.x = 10;
			player.y = 10;
			socket.join(player.area); // join the zone they're in
			if (areas[''+areaRecord['_id']+''] == undefined) { areas[''+areaRecord['_id']+''] = areaRecord; } // if area not being tracked yet, track it
			socket.emit('area-jump-result', { x: player.x, y: player.y, newArea: areaRecord});
			socket.broadcast.to(player.area).volatile.emit('updatePlayer', player); // send this updated player data out to other clients
		});
	});
	
});


/*

	helper functions

*/

// function to remove a player from the server-side array of players
function removePlayer(player) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].name == player.name) {
			players.splice(i, 1);
		}
	}
}

/*

	the server-side general stuff engine
	
*/

var lastGeneralTime = new Date();

setInterval(function() {
	
	var nowTime = new Date();
	var deltaTime = (nowTime - lastGeneralTime)/1000; // deltaTime = percentage of one second elapsed between "frames"
	
	// rebuild active areas
	active_areas = [];
	for (var i = 0; i < players.length; i++) {
		active_areas.push(players[i].area);
	}
	
	// salvage-ables
	if (salvages.length < 10 && players.length > 0) { // if it's less than 10, maybe make a new one?
		if (randomInt(0, 1000) > 500) { // chance high for development
			//console.log('making a new salvage object!');
			var salvage = new Salvage( active_areas[0] );
			salvages.push(salvage);
			io.sockets.in(salvage.area).emit('newSalvage', { id: salvage.id, x: salvage.x, y: salvage.y });
		}
	}
	
	// update salvage-ables
	for (var i = 0; i < salvages.length; i++) {
		salvages[i].update(deltaTime);
	}
	
	// any salvage-ables done? send out an update
	for (var i = 0; i < salvages.length; i++) {
		if (salvages[i].done == true) {
			io.sockets.in(salvages[i].area).emit('removeSalvage', { id: salvages[i].id });
			salvages.splice(i, 1); // remove from the array of salvages
		}
	}
	
	lastGeneralTime = new Date();
	
}, 100); // 100 = 10fps

/*

	the server-side physics engine

*/

var lastPhysicsTime = new Date();

setInterval(function() {
	
	var nowTime = new Date();
	var deltaTime = (nowTime - lastPhysicsTime)/1000; // deltaTime = percentage of one second elapsed between "frames"
	//console.log('delta time: ' + deltaTime);
	
	// go through the bullets, update them
	for (var i = 0; i < bullets.length; i++) {
		bullets[i].update(deltaTime); // update!
		bullets[i].checkCollisions(); // check to see if the bullet hit anything
		if (bullets[i].didHit != false) {
			io.sockets.in(bullets[i].area).emit('removeBullet', { id: bullets[i].id, didHit: bullets[i].didHit });
			bullets.splice(i, 1); // remove from the array of bullets
		} else if (bullets[i].done == true) {
			io.sockets.in(bullets[i].area).emit('removeBullet', { id: bullets[i].id, didHit: false });
			bullets.splice(i, 1); // remove from the array of bullets
		} else {
			io.sockets.in(bullets[i].area).emit('updateBullet', { id: bullets[i].id, x: bullets[i].x, y: bullets[i].y, angle: bullets[i].angle });
		}
	}
	
	// see if anybody's dead!
	for (var i = 0; i < players.length; i++) {
		if (players[i].hpCurrent <= 0) {
			//console.log( players[i].name + ' is dead!');
		}
	}
	
	lastPhysicsTime = new Date();
	
}, 15); // 100 = 10fps, 20 = 50fps, 15 = 66.667fps

/*

	the Player class

*/

function Player() {
	this.objID = ''; // their unique mongodb ID
	this.name = ''; // this will be filled in by the player
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.angle = 0.0;
	this.thrustDirection = 0;
	this.area = ''; // dunno where they are yet
	this.hpCurrent = 50;
}

Player.prototype.updatePosition = function(x, y, angle, direction) {
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.thrustDirection = direction;
}

Player.prototype.damage = function(amount) {
	this.hpCurrent -= amount;
}

/*

	the Bullet class

*/

function Bullet(area, x, y, angle, type, playerOwner) {
	// position info
	this.area = area;
	this.x = x;
	this.y = y;
	this.z = 0.0;
	this.angle = angle; // the angle it's travelling at
	
	// meta info
	this.id = Math.random() * 100000;
	this.type = type;
	this.playerOwner = playerOwner;
	
	// look up type of weapon for info on it? speed, damage, etc?
	// make sure player actually has this weapon?
	
	// distance info
	this.distanceTravelled = 0.0; // how far has it gone so far
	this.distanceLimit = 30; // when should it stop travelling
	this.distancePerTick = 0.0; // how many units does it travel per update
	this.currentSpeed = 35; // the speed of it (constant)
	
	// state info
	this.done = false;
	this.didHit = false;
}

Bullet.prototype.update = function(dTime) {
	// travel:
	var lastX = this.x;
	var lastY = this.y;
	this.x += (Math.sin(this.angle) * -this.currentSpeed) * dTime;
	this.y += (Math.cos(this.angle) * this.currentSpeed) * dTime;
	if (this.distancePerTick == 0.0) { // figure out how far it travels per update
		this.distancePerTick = Math.sqrt( Math.pow(this.x - lastX, 2) + Math.pow(this.y - lastY, 2) );
	}
	this.distanceTravelled += this.distancePerTick; // add how far it's gone so far
	if (this.distanceTravelled >= this.distanceLimit) { // gone far enough?
		this.done = true; // done, kid
	}
}

Bullet.prototype.checkCollisions = function() {	
	// this should go into all of the other players' ships,
	// all of the other destroyable objects in its area
	// and say whether it has hit or not
	
	// check through stuff in the zone
	for (var i = 0; i < areas[this.area].stuff.length; i++) {
		var this_thing = areas[this.area].stuff[i];
		// if the bullet enters a safe zone, it's done
		if (this_thing.type == 'safezone' && pointInsideRectangle(this_thing.x, this_thing.y, this_thing.width, this_thing.height, this.x, this.y)) {
			console.log('bullet entered safe zone, removing...');
			this.done = true;
			return;
		} else if (this_thing.type == 'asteroid' && pointInsideCircle(this_thing.x, this_thing.y, this_thing.model.size/2, this.x, this.y)) { // if the bullet hits an asteroid, show an explosion
			console.log('bullet hit asteroid');
			this.didHit = { x: this.x, y: this.y, playerName: 'asteroid' };
			return;
		}
	}
	
	// check to see if it hit another player
	var playerSize = 2; // use this as the player ships' bounding box, for now
	
	// go through all of the players' ships
	for (var i = 0; i < players.length; i++) {
		if (players[i].name != this.playerOwner) {
			if (pointInsideRotatedRect(players[i].x, players[i].y, playerSize, playerSize, players[i].angle, this.x, this.y)) {
				console.log('player ' + this.playerOwner + ' hit player ' + players[i].name);
				this.didHit = { x: this.x, y: this.y, playerName: players[i].name, damage: 5 };
				// update player's HP that was hit?
				players[i].damage(5);
				return;
			}
		}
	}
	
}

/*

	the Salvage-able class

*/

function Salvage(area) {
	// position info
	this.area = area;
	this.x = randomFloat(0, 100);
	this.y = randomFloat(0, 100);
	this.z = 0.0;
	
	// meta info
	this.id = Math.random() * 100000;
	this.timeSoFar = 0.0; // how much time has this piece of salvage been active
	this.timeLimit = 30; // disappears after this many seconds
	this.done = false;
}

Salvage.prototype.update = function(dTime) {
	// add how much time has passed
	this.timeSoFar += dTime;
	if (this.timeSoFar > this.timeLimit) {
		this.done = true;
	}
}