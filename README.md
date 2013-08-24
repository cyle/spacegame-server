# SPACE GAME! Server

This is the server half of **SPACE GAME!**

To use it properly, you should get the client as well.

## Dependencies

- Node.js (version 0.10 or higher)
- Socket.io (tested using version 0.9.16)
- Moniker (tested using version 0.1.2)

## Usage

Pretty simple: `node server.js` for now.

## Server Functionality

- On new player, comes up with a unique name for them.
- Maintains the position of player ships across clients.

## Server To-Do

- Stop shelling out a player's position if they are inside of a nebula.