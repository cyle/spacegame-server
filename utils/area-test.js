#!/usr/bin/env node

var Zone = require('./area-utils.js');

//console.log('new asteroid field:');
//console.log(Zone.createAsteroidField(100, 100, 50, 50));

//console.log('new asteroid circle:');
//console.log(Zone.createAsteroidCircle(100, 100, 50));

console.log('new asteroid ring:');
console.log(Zone.createAsteroidRing(100, 100, 50, undefined, true));

//console.log('new asteroid belt:');
//console.log(Zone.createAsteroidBelt(100, 100, 100, 100));