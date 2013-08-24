/*

	the SPACE GAME! server, for multiplayer

*/

console.log('SPACE GAME! server, revving up...');

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app); // this is the magic
var Moniker = require('moniker'); // this will make up random names for new players

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
	console.log('new player:');
	console.log(player);
	// give the new player their name
	socket.emit('welcome', player.name);
	if (players.length > 0) { // if there's more than one other player...
		socket.emit('otherPlayers', players); // give the new player the other players
	}
	players.push(player); // add new player to array of players
	// send to all players this new player's attributes
	io.sockets.emit('newPlayer', player);
	
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
	this.angle = 0.0;
}

Player.prototype.updatePosition = function(x, y, angle) {
	this.x = x;
	this.y = y;
	this.angle = angle;
}