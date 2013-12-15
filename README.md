# SPACE GAME! Server

This is the server half of **SPACE GAME!**

To use it properly, you should get the [SPACE GAME! client](https://github.com/cyle/spacegame-client) as well.

## Important Note

This is super alpha. There's a lot going on here, and it'll change all the time, most likely. So be aware that this documentation probably isn't 100% accurate, but I'll try to keep it updated as best I can.

## Dependencies

- Ubuntu 12.04.3 64bit (used in development)
- Node.js (version 0.10 or higher)
- Node.js Module: Socket.io (tested using version 0.9.16)
- Node.js Module: Mongolian (tested using version 0.1.18)
- Node.js Module: sigil (tested using version 0.0.1)
- MongoDB (tested using version 2.4.6)
- SIGIL (tested using version 0.0.2)

## Installation Prereqs

Install Node.js, MongoDB, and SIGIL...

Install Node.js via `apt`:

    apt-get install python-software-properties
    add-apt-repository ppa:chris-lea/node.js
    apt-get update
    apt-get install nodejs

Install Go via `godeb`: (this can actually be skipped for now, not using SIGIL yet)

    wget https://godeb.s3.amazonaws.com/godeb-amd64.tar.gz
    tar zxf godeb-amd64.tar.gz
    ./godeb install

Install SIGIL via git: (this can actually be skipped for now, not using SIGIL yet)

    apt-get install git-core mercurial
    mkdir /opt/sigil
    cd /opt/sigil
    export GOPATH=`pwd`
    mkdir src pkg bin
    git clone https://github.com/cyle/sigil.git src/
    go get code.google.com/p/gorest
    cd src/
    go run db.go

Install MongoDB via `apt`:

    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list
    apt-get update
    apt-get install mongodb-10gen

That's all, you should have the necessary dependencies now.

## Install the Server Itself

Clone the repository for this server into a directory, such as `/opt/spacegame`

    mkdir /opt/spacegame
    git clone https://github.com/cyle/spacegame-server.git /opt/spacegame/
    cd /opt/spacegame/
    npm install socket.io mongolian sigil

Make sure MongoDB and SIGIL are running.

That should be it!

## Usage

Pretty simple: `node server.js` for now. Players connecting with their browser-based clients must enter the IP or hostname of this server.

If you are just starting, you need to run `node utils/build-start-area.js` to build the starting area, or else players won't have anywhere to spawn.

## Server Functionality

- keeps track of all players currently connected
- on a returning player, sends where they are and whatnot
- on a new player, creates a new record in the starting area
- updates all players on each others' positions (this should be limited per area sometime)
- sends area information based on queries or connecting players

## Server To-Do

- a lot of things...