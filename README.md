# SPACE GAME! Server

This is the server half of **SPACE GAME!**

To use it properly, you should get the client as well.

## Dependencies

- Node.js (version 0.10 or higher)
- Node.js Module: Socket.io (tested using version 0.9.16)
- Node.js Module: Moniker (tested using version 0.1.2)
- Node.js Module: Mongolian (tested using version 0.1.18)
- Node.js Module: sigil-node (tested using version 0.0.1)
- MongoDB (tested using version 2.4.6)
- SIGIL (tested using version 0.0.1)

## Installation

Install Node.js, MongoDB, and SIGIL.

Clone the repository for this server into a directory.

In that directory, run `npm install socket.io moniker mongolian`

Make sure MongoDB and SIGIL are running.

That should be it!

## Usage

Pretty simple: `node server.js` for now.

## Server Functionality

- On new player, comes up with a unique name for them.
- Maintains the position of player ships across clients.

## Server To-Do

- Stop shelling out a player's position if they are inside of a nebula.