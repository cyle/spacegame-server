/*

	the SPACE GAME! server, for multiplayer

*/

console.log('SPACE GAME! server, revving up...');

// load the external requirements
var Moniker = require('moniker'); // this will make up random names for new players
var Mongolian = require('mongolian'); // mongodb client
var sigil = require('sigil'); // my graph database client

// set up mongodb connection
var mongoserver = new Mongolian('spacegame.com'); // spacegame.com is /etc/host to a local VM
var mdb = mongoserver.db('spacegame'); // the mongodb database called "spacegame"
var players_db = mdb.collection('players');

// get it going
var app = require('http').createServer(handler); // make the new HTTP server
var io = require('socket.io').listen(app); // this is the magic
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
			if (err) { console.log(err); }
			player = new Player(); // set up new player object
			if (playerRecord != undefined) {
				// player found in database -- use that info
				console.log('returning player!');
				player.name = playerRecord.name;
				player.x = playerRecord.position.x;
				player.y = playerRecord.position.y;
				player.angle = playerRecord.position.angle;
			} else {
				// player NOT found... create new
				console.log('new player!');
				player.name = name;
				players_db.insert({ 'name': name, 'position': { 'x': 0, 'y': 0, 'z': 0, 'angle': 0 } });
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
	
	// if the player disconnects, tell everyone so they can stop rendering them
	socket.on('disconnect', function () {
		console.log('player left: ' + player.name);
		io.sockets.emit('removePlayer', player.name);
		removePlayer(player);
	});
	
	// when a player moves, let everyone know
	socket.on('move', function (data) {
		//console.log(data);
		player.updatePosition(data.x, data.y, data.angle); // update the player's position
		io.sockets.emit('updatePlayer', player); // send this updated player data out to clients
		// update the server-side array of players
		for (i = 0; i < players.length; i++) {
			if (players[i].name == player.name) {
				players[i].updatePosition(data.x, data.y, data.angle);
			}
		}
		// update the database
		players_db.update( { 'name': player.name }, { '$set': { 'position.x': data.x, 'position.y': data.y, 'position.angle': data.angle } } );
	});
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
	this.name = Moniker.choose();
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.angle = 0.0;
}

Player.prototype.updatePosition = function(x, y, angle) {
	this.x = x;
	this.y = y;
	this.angle = angle;
}