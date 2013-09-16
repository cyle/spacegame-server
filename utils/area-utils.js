/*

	helper functions for building zones

*/

function randomInt(min, max) {
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

function degreesToRadians(degrees) {
	return degrees * (Math.PI/180);
}

function radiansToDegrees(radians) {
	return radians * (180/Math.PI);
}

// creates standard rectangle-shaped asteroid field
exports.createAsteroidField = function(centerX, centerY, width, height, density) {
	var field = [];
	
	var half_width = width/2;
	var half_height = height/2;
	var field_area = width * height;
	var num_asteroids = 0;
	if (density != undefined) {
		num_asteroids = field_area * density;
	} else {
		num_asteroids = field_area * randomFloat(0.005, 0.03);
	}
	num_asteroids = Math.round(num_asteroids);
	
	console.log('number of asteroids in field: ' + num_asteroids);
	
	for (var i = 0; i < num_asteroids; i++) {
		var a = {};
		a.x = randomFloat( centerX - half_width, centerX + half_width );
		a.y = randomFloat( centerY - half_height, centerY + half_height );
		field.push(a);
	}
	
	return field;
}

// creates a circle-shaped field of asteroids, with a potential blank space inside
exports.createAsteroidCircle = function(centerX, centerY, radius, density) {
	var field = [];
	
	var field_area = Math.PI * (radius * radius);
	var num_asteroids = 0;
	if (density != undefined) {
		num_asteroids = field_area * density;
	} else {
		num_asteroids = field_area * randomFloat(0.005, 0.03);
	}
	num_asteroids = Math.round(num_asteroids);
	
	console.log('number of asteroids in circle: ' + num_asteroids);
	
	var blank = undefined;
	if (randomInt(0, 1000) > 500) {
		blank = {};
		// there IS a blank space
		var blank_t = randomFloat(0, Math.PI * 2);
		var blank_u = Math.random() + Math.random();
		var blank_r = 0;
		if (blank_u > 1) {
			blank_r = 2 - blank_u;
		} else {
			blank_r = blank_u;
		}
		blank.x = centerX + (radius * blank_r) * Math.cos(blank_t);
		blank.y = centerY + (radius * blank_r) * Math.sin(blank_t);
		blank.r = randomFloat(radius/5, radius/3);
	}
	
	for (var i = 0; i < num_asteroids; i++) {
		var a = {};
		var t = randomFloat(0, Math.PI * 2);
		var u = Math.random() + Math.random();
		var r = 0;
		if (u > 1) {
			r = 2 - u;
		} else {
			r = u;
		}
		a.x = centerX + (radius * r) * Math.cos(t);
		a.y = centerY + (radius * r) * Math.sin(t);
		if (blank != undefined) { // if there is a blank area, make sure we're not inside of it
			var square_dist = Math.pow(blank.x - a.x, 2) + Math.pow(blank.y - a.y, 2);
			if (square_dist > Math.pow(blank.r, 2)) {
				field.push(a);
			} else {
				console.log('asteroid in blank space, trying again...');
				i = i - 1;
			}
		} else {
			field.push(a);
		}
	}
	
	return field;
}

// creates a ring of asteroids around a center point
exports.createAsteroidRing = function(centerX, centerY, radius, density, hasLanes) {
	var field = [];
	
	var field_area = Math.PI * (radius * radius);
	var blankRadius = randomFloat(radius/2, radius - radius/8);
	console.log('blank radius: ' + blankRadius);
	var num_asteroids = 0;
	if (density != undefined) {
		num_asteroids = field_area * density;
	} else {
		num_asteroids = field_area * randomFloat(0.005, 0.03);
	}
	num_asteroids = Math.round(num_asteroids);
	
	console.log('number of asteroids in ring: ' + num_asteroids);
	
	var lane = undefined;
	if (hasLanes) {
		lane = {};
		lane.angle = randomFloat(0, Math.PI * 2);
		lane.width = randomFloat(radius/5, radius/3);
		console.log('lane angle: ' + lane.angle + ', width: ' + lane.width);
	}
	
	for (var i = 0; i < num_asteroids; i++) {
		var a = {};
		var t = randomFloat(0, Math.PI * 2);
		var u = Math.random() + Math.random();
		var r = 0;
		if (u > 1) {
			r = 2 - u;
		} else {
			r = u;
		}
		a.x = centerX + (radius * r) * Math.cos(t);
		a.y = centerY + (radius * r) * Math.sin(t);
		var square_dist = Math.pow(centerX - a.x, 2) + Math.pow(centerY - a.y, 2);
		if (square_dist > Math.pow(blankRadius, 2)) {
			if (lane != undefined && pointInsideRotatedRect(centerX, centerY, lane.width, radius * 2, lane.angle, a.x, a.y)) {
				i = i - 1;
			} else {
				field.push(a);
			}
		} else {
			i = i - 1;
		}
	}
	
	return field;
}

// creates a randomly-pivoting belt of asteroids starting at given coords
exports.createAsteroidBelt = function(startX, startY, maxWidth, maxHeight, bufferDistance, avgBeltLength, density) {
	var field = [];
	
	var asteroidBufferDistance = bufferDistance;
	var angleMin = degreesToRadians(10);
	var angleMax = degreesToRadians(60);
	var minDistance = avgBeltLength * 0.5;
	var maxDistance = avgBeltLength * 1.5;
	var avgDistance = avgBeltLength;
	var steps = Math.ceil(maxWidth/avgDistance) + 1;
	var maxX = startX + maxWidth;
	var maxY = startY + maxHeight/2;
	var minY = startY - maxHeight/2;
	var field_area = avgDistance * (asteroidBufferDistance * 2); // area per step
	var num_asteroids = 0;
	if (density != undefined) {
		num_asteroids = field_area * density;
	} else {
		num_asteroids = field_area * randomFloat(0.005, 0.03);
	}
	num_asteroids = Math.round(num_asteroids);
	
	var totalWidth = 0;
	var numLanes = 0;
	var lastX = startX;
	var lastY = startY;

	for (var i = 0; i < steps; i++) {
		
		console.log('step #' + i);
		
		var distanceAway = randomFloat(minDistance, maxDistance);
		var angle = randomFloat(angleMin, angleMax);

		if (randomFloat(0, 100) > 50) {
			angle = angle * -1;
		}

		var nextX = lastX + Math.cos(angle) * distanceAway;
		var nextY = lastY + Math.sin(angle) * distanceAway;

		if (nextY - asteroidBufferDistance < minY || nextY + asteroidBufferDistance > maxY) {
			i = i - 1;
			continue;
		}

		if (nextX + asteroidBufferDistance > maxX) {
			break;
		}

		var laneX = 0;
		var laneY = 0;
		var laneWidth = randomFloat(20, 40);
		var laneHeight = 150;

		if (randomFloat(0, 100) > 45) {
			var laneHowFarAlong = distanceAway * randomFloat(0.2, 0.8);
			laneX = lastX + Math.cos(angle) * laneHowFarAlong;
			laneY = lastY + Math.sin(angle) * laneHowFarAlong;
			numLanes += 1;
		}

		for (var k = 0; k < num_asteroids; k++) {
			var a = {};
			var howFarAlong = distanceAway * Math.random();
			a.x = lastX + Math.cos(angle) * howFarAlong;
			a.y = lastY + Math.sin(angle) * howFarAlong;
			a.x = a.x + randomFloat(-asteroidBufferDistance, asteroidBufferDistance);
			a.y = a.y + randomFloat(-asteroidBufferDistance, asteroidBufferDistance);
			if (laneX != 0 && laneY != 0 && pointInsideRotatedRect(laneX, laneY, laneWidth, laneHeight, angle, a.x, a.y)) {
				k = k - 1;
			} else {
				field.push(a);
			}
		}

		totalWidth += nextX - lastX;

		lastX = nextX;
		lastY = nextY;

	}
	
	return field;
}
