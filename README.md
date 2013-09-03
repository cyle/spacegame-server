# SPACE GAME! Server

This is the server half of **SPACE GAME!**

To use it properly, you should get the client as well.

## Dependencies

- Node.js (version 0.10 or higher)
- Node.js Module: Socket.io (tested using version 0.9.16)
- Node.js Module: Mongolian (tested using version 0.1.18)
- Node.js Module: sigil (tested using version 0.0.1)
- MongoDB (tested using version 2.4.6)
- SIGIL (tested using version 0.0.2)

## Installation

Install Node.js, MongoDB, and SIGIL.

Clone the repository for this server into a directory.

In that directory, run `npm install socket.io mongolian sigil`

Make sure MongoDB and SIGIL are running.

That should be it!

## Usage

Pretty simple: `node server.js` for now. Players connecting with their clients must enter the IP or hostname of this server.

If you are just starting, I also suggest running `node utils/build-new-area.js` to build the starting area.

Right now the mongodb ID of this "starting area" is defined on line 72 of `server.js`, so you'll probably need to update that with your starting area.

## Server Functionality

- keeps track of all players currently connected
- on a returning player, sends where they are and whatnot
- on a new player, creates a new record in the starting area
- updates all players on each others' positions (this should be limited per area sometime)
- sends area information based on queries or connecting players

## Server To-Do

- a lot of things...