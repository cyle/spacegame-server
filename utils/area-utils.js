/*

	helper functions for building zones

*/

// return a random integer
function randomInt(min, max) {
	if (max == undefined) { // assume it's between 0 and whatever
		return Math.floor(Math.random() * (min + 1));
	} else {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

// return a random float
function randomFloat(min, max) {
	if (max == undefined) { // assume it's between 0 and whatever
		return Math.random() * min;
	} else {
		return Math.random() * (max - min) + min;
	}
}

// return whether or not a point is within a rotated rectangle
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
//   centerX, centerY, width, and height are all required
//   density helps determine how many asteroids are within the rectangle (optional)
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
	
	//console.log('number of asteroids in field: ' + num_asteroids);
	
	for (var i = 0; i < num_asteroids; i++) {
		var a = {};
		a.x = randomFloat( centerX - half_width, centerX + half_width );
		a.y = randomFloat( centerY - half_height, centerY + half_height );
		field.push(a);
	}
	
	return field;
}

// creates a circle-shaped field of asteroids, with a potential blank space inside
//   centerX, centerY, and radius are required
//   blankSpace explicity sets whether there's a blank space inside the circle somewhere (if undefined, there's a chance) (optional)
//     or, you can set blankSpace to be an object where you'd like the blank space to be, relative to the center
//     so setting blankSpace to { x: 10, y: 10, r: 25 } makes a 25-radius blank space centerX + 10 and centerY + 10
//   density helps determine how many asteroids are within the circle (optional)
exports.createAsteroidCircle = function(centerX, centerY, radius, blankSpace, density) {
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
	if (typeof blankSpace === 'object') {
		blank = {};
		blank.x = centerX + blankSpace.x;
		blank.y = centerY + blankSpace.y;
		blank.r = blankSpace.r;
		console.log('blank space radius: ' + blank.r);
	} else if (blankSpace == true || (blankSpace == undefined && randomInt(0, 100) > 50)) {
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
		console.log('blank space radius: ' + blank.r);
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
				i = i - 1;
			}
		} else {
			field.push(a);
		}
	}
	
	return field;
}

// creates a ring of asteroids around a center point
//   centerX, centerY, and outerRadius are all required
//   innerRadius explicitly sets how large the "blank space" in the center is, default = random
//   density explicitly sets how dense the asteroid field is, default = random
//   hasLanes explicitly sets whether the ring has lanes cut through it, default = false
//   fuzzy explicitly sets whether the ring is a tight circle or is a little looser, default = false
exports.createAsteroidRing = function(centerX, centerY, outerRadius, innerRadius, density, hasLanes, fuzzy) {
	var field = [];
	
	console.log('new asteroid ring');
	console.log('outer radius: ' + outerRadius)
	
	if (innerRadius == undefined) {
		innerRadius = randomFloat(outerRadius/4, outerRadius - outerRadius/8);
	}
	console.log('blank inner radius: ' + innerRadius);
	
	var field_area = (Math.PI * (outerRadius * outerRadius)) - (Math.PI * (innerRadius * innerRadius));
	console.log('total area in the ring: ' + field_area);
	
	var num_asteroids = 0;
	if (density != undefined) {
		num_asteroids = field_area * density;
	} else {
		num_asteroids = field_area * randomFloat(0.005, 0.05);
	}
	num_asteroids = Math.round(num_asteroids);
	console.log('number of asteroids in ring: ' + num_asteroids);
	
	if (fuzzy == undefined) {
		fuzzy = false;
		console.log('ring will NOT be fuzzy');
	} else if (fuzzy) {
		fuzzy = true;
		console.log('ring will totally be fuzzy');
	}
	
	var lanes = undefined;
	if (hasLanes) {
		var num_lanes = randomInt(1, 4);
		lanes = [];
		for (var l = 0; l < num_lanes; l++) {
			lanes[l] = {};
			lanes[l].angle = randomFloat(0, Math.PI * 2);
			lanes[l].width = randomFloat(outerRadius/5, outerRadius/3);
			lanes[l].x = centerX + (outerRadius * Math.cos(lanes[l].angle));
			lanes[l].y = centerY + (outerRadius * Math.sin(lanes[l].angle));
			console.log('lane x: '+lanes[l].x+', y: '+lanes[l].y+', angle: ' + lanes[l].angle + ', width: ' + lanes[l].width);
		}
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
		var workingOuterRadius = outerRadius;
		var workingInnerRadius = innerRadius;
		if (fuzzy && randomInt(0, 100) > 80) {
			workingOuterRadius += outerRadius * 0.1;
			workingInnerRadius -= innerRadius * 0.1;
		}
		a.x = centerX + (workingOuterRadius * r) * Math.cos(t);
		a.y = centerY + (workingOuterRadius * r) * Math.sin(t);
		var square_dist = Math.pow(centerX - a.x, 2) + Math.pow(centerY - a.y, 2);
		if (square_dist > Math.pow(workingInnerRadius, 2)) {
			if (lanes != undefined) {
				var hit_lane = false;
				for (var l = 0; l < lanes.length; l++) {
					if (pointInsideRotatedRect(lanes[l].x, lanes[l].y, workingOuterRadius, lanes[l].width, lanes[l].angle, a.x, a.y)) {
						hit_lane = true;
					}
				}
				if (hit_lane) {
					i = i - 1;
				} else {
					field.push(a);
				}
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
// this works by going through a number of "belt steps" to create a pivoting set of connected points
// and then forms asteroids around and along that path, which creates the actual belt
//   startX and startY are where the belt begins (required)
//   maxWidth and maxHeight are the limits of how large it can get (required)
//   bufferDistance is how far away from the "belt steps" an asteroid can be placed (required)
//   avgBeltLength is how long you'd like each "belt step" to be on average (required)
//   density helps determine how many asteroids will be in the belt (optional)
exports.createAsteroidBelt = function(startX, startY, maxWidth, maxHeight, bufferDistance, avgBeltLength, density) {
	var field = [];
	console.log('new asteroid belt');
	console.log('starting: x = '+startX+', y = '+startY);
	console.log('max width = '+maxWidth+', max height = '+maxHeight);
	console.log('buffer distance: '+bufferDistance);
	var asteroidBufferDistance = bufferDistance;
	var angleMin = degreesToRadians(randomInt(0, 360));
	var angleMax = angleMin + degreesToRadians(50);
	console.log('angle min: '+radiansToDegrees(angleMin)+', max: '+radiansToDegrees(angleMax));
	var minDistance = avgBeltLength * 0.5;
	var maxDistance = avgBeltLength * 1.5;
	var avgDistance = avgBeltLength;
	console.log('min belt length distance: '+minDistance+', max: '+maxDistance+', avg: '+avgDistance);
	var steps = Math.ceil(maxWidth/avgDistance) + 1;
	console.log('max steps in belt: ' + steps);
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
	console.log('number of asteroids per step: ' + num_asteroids);
	
	var maxAttempts = 10;
	var numAttempts = 0;
	var numSteps = 0;
	var totalWidth = 0;
	var numLanes = 0;
	var lastX = startX;
	var lastY = startY;

	for (var i = 0; i < steps; i++) {
		
		//console.log('step #' + i);
		
		var distanceAway = randomFloat(minDistance, maxDistance);
		var angle = randomFloat(angleMin, angleMax);

		if (randomFloat(0, 100) > 50) {
			angle = angle * -1;
		}

		var nextX = lastX + Math.cos(angle) * distanceAway;
		var nextY = lastY + Math.sin(angle) * distanceAway;

		if (nextY - asteroidBufferDistance < minY || nextY + asteroidBufferDistance > maxY) {
			i = i - 1;
			numAttempts++;
			if (numAttempts > maxAttempts) { break; }
			continue;
		}

		if (nextX + asteroidBufferDistance > maxX || nextX - asteroidBufferDistance > maxX) {
			i = i - 1;
			numAttempts++;
			if (numAttempts > maxAttempts) { break; }
			continue;
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
		
		numSteps++;

	}
	
	console.log('ended after ' + numSteps);
	
	return field;
}
