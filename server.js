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

// do not serve anything over http
function handler(req, res) {
	res.writeHead(500);
    res.end('Nope.');
}

// this will hold onto all current players
var players = [];

io.sockets.on('connection', function(socket) {
	
	// on new connection, make a new player object for them
	var player = new Player();
	
	// log the new player
	console.log('player connected');
	
	socket.on('connected', function(name) {
		
		// check to see if the name exists already
		for (var i = 0; i < players; i++) {
			if (players[i].name == name) { // if so, send along their info
				player = players[i];
				socket.emit('welcome', player);
				io.sockets.emit('newPlayer', player);
				return;
			}
		}
		
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
				player.area = '5225235a000000d063000002'; // starting area mongodb ID
				var newplayer_doc = { 'name': name, 'position': { 'x': 0, 'y': 0, 'z': 0, 'angle': 0, 'area': new ObjectId(player.area) } };
				players_db.insert(newplayer_doc);
				player.objID = '' + newplayer_doc['_id'] + ''; // their new mongodb ID
				console.log('new player ID: ' + player.objID);
				areas_db.update( {'name': 'starting area'}, {'$push': { 'players': newplayer_doc['_id'] } } );
			}
			console.log(player); // current player
			// add new player to array of players
			players.push(player);
			socket.emit('welcome', player);
			io.sockets.emit('newPlayer', player); // send to all players this new player's attributes
		});
		
		if (players.length > 0) { // if there's more than one other player...
			socket.emit('otherPlayers', players); // give the new player the other players
		}
		
	});
	
	// fetch the player's current area
	socket.on('get-current-area', function() {
		var player_objID = new ObjectId(player.objID);
		areas_db.findOne({ 'players': player_objID }, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find where the current player is'); return; }
			socket.emit('current-area-data', areaRecord);
		});
	});
	
	// fetch and send full data about an area based on given ID
	socket.on('get-area', function(area_id) {
		var area_objID = new ObjectId(area_id);
		areas_db.findOne({ '_id': area_objID }, function(err, areaRecord) {
			if (err) { console.log(err); return; }
			if (areaRecord == undefined) { console.log('could not find an area with the ID ' + area_id); return; }
			socket.emit('area-data', areaRecord);
		});
	});
	
	// if the player disconnects, tell everyone so they can stop rendering them
	socket.on('disconnect', function() {
		// update the database with their last known location
		players_db.update( { 'name': player.name }, { '$set': { 'position.x': player.x, 'position.y': player.y, 'position.angle': player.angle } } );
		console.log('player left: ' + player.name);
		io.sockets.emit('removePlayer', player.name); // tell everyone the player is gone
		removePlayer(player); // stop tracking the player on the server side
	});
	
	// when a player moves, let everyone know
	var moveCounter = 0;
	var maxMovesBeforeUpdate = 120; // this equates to once every two seconds or so
	socket.on('move', function (data) {
		//console.log(data);
		player.updatePosition(data.x, data.y, data.angle, data.direction); // update the player's position
		io.sockets.volatile.emit('updatePlayer', player); // send this updated player data out to clients
		// update the server-side array of players
		for (i = 0; i < players.length; i++) {
			if (players[i].name == player.name) {
				players[i].updatePosition(data.x, data.y, data.angle, data.direction);
			}
		}
		moveCounter++;
		if (moveCounter == maxMovesBeforeUpdate) {
			//console.log('updating ' + player.name + ' location in database');
			// update the database
			players_db.update( { 'name': player.name }, { '$set': { 'position.x': data.x, 'position.y': data.y, 'position.angle': data.angle } } );
			moveCounter = 0;
		}
	}); // end move update
	
});

// function to remove a player from the server-side array of players
function removePlayer(player) {
	for (i = 0; i < players.length; i++) {
		if (players[i].name == player.name) {
			players.splice(i, 1);
		}
	}
}

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
}

Player.prototype.updatePosition = function(x, y, angle, direction) {
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.thrustDirection = direction;
}