/*
	boxCar2d ZPG
	
	Author : greeger
	grigoriydeev.rar@gmail.com
*/

//Global game object
let global_game = null;

//start game once page has finished loaded
$(function() {start_game();});

function start_game() {
	let g = new game();
	
	//store game pointer in a global object
	global_game = g;
	
	$(window).resize(function() {g.resize();});
	
	g.start();
}

function game() {
	this.fps = 60;
	
	this.scale = 100;
	this.camera = new b2Vec2();
	
	this.minPos = new b2Vec2(1.5, 1.4);
	this.maxPos = new b2Vec2(2.5, 2.7);
	
	//global array of all objects to manage
	this.game_objects = [];
	
	this.to_destroy = [];
	this.time_elapsed = 0;
	
	this.currDist = 0;
	this.currTime = 0;
	this.currIdle = 0;
}

game.prototype.resize = function() {
	let canvas = this.canvas;
	
	//Set the canvas dimensions to match the window dimensions
	let w = $(window).innerWidth();
	let h = $(window).innerHeight();
	
	canvas.width(w);
	canvas.height(h);
	
	canvas.attr('width' , w);
	canvas.attr('height' , h);
	
	this.canvas_width = canvas.attr('width');
	this.canvas_height = canvas.attr('height');
	
	this.screen_height = 4;
	this.scale = this.canvas_height / this.screen_height;
	this.screen_width = this.canvas_width / this.scale;
}

game.prototype.setup = function() {
	for(let i = 0; i < this.game_objects.length; i++)
		this.destroy_object(this.game_objects[i]);
	this.perform_destroy();
	this.game_objects = [];
	
	//track
	let currX = 0;
	let currY = 1;
	for(let i = 0; i < 100; i++) {
		newY = currY + (this.map[i] - 0.5) * i / 50;
		newX = currX + 1;
		let arr = [new b2Vec2(0, 0), new b2Vec2(-0.1, -0.1),
			new b2Vec2(newX - currX -0.1, newY - currY - 0.1), new b2Vec2(newX - currX, newY - currY)];
		this.game_objects.push(new track({x : currX, y : currY, arr : arr, game : this}));
		currX = newX;
		currY = newY;
	}
	this.game_objects.push(new car({x : 3, y : 2.2, genome : this.genomes[this.currCar], game : this}));
	
	this.tick();
}

//Start the game
game.prototype.start = function() {
	this.ctx = ctx = $('#canvas').get(0).getContext('2d');
	let canvas = $('#canvas');
	this.canvas = canvas;
	
	//resize to correct size
	this.resize();
	
	//dimensions in metres
	let w = this.screen_width;
	let h = this.screen_height;
		
	//create the box2d world
	this.create_box2d_world();
	
	//this.start_handling();
	//this.setup_collision_handler();
	
	this.map = [];
	for(let i = 0; i < 100; i++)
		this.map.push(Math.random());
	
	this.genomes = [];
	for(let i = 0; i < 10; i++)
		this.genomes.push(randGenome());
	
	this.currCar = 0;
	this.generation = 0;
	
	this.parents = [];
	for(let i = 0; i < 10; i++)
		this.parents.push(-1);
	this.numbers = [];
	for(let i = 0; i < 10; i++)
		this.numbers.push(i);
	
	this.times = [];
	this.distances = [];
	
	this.is_paused = false;
	this.on = true;
	this.setup();
}

game.prototype.endRun = function() {
	this.distances.push(this.currDist);
	this.times.push(this.currTime);
	this.currDist = 0;
	this.currTime = 0;
	this.currIdle = 0;
	this.on = false;
	
	if(this.currCar == 9){
		this.map = [];
		for(let i = 0; i < 100; i++)
			this.map.push(Math.random());
		this.currCar = 0;
		
		let order = getOrder(this.distances, this.times);
		
		let newParents = [];
		for(let i = 0; i < 9; i++)
			newParents.push(this.parents[order[i]]>=0?this.parents[order[i]]:this.numbers[order[i]]);
		newParents.push(-1);
		
		let newNumbers = [];
		for(let i = 0; i < 9; i++)
			newNumbers.push(this.parents[order[i]]>=0?this.numbers[order[i]]+1:0);
		newNumbers.push(this.generation + 9);
		
		let newGenomes = [];
		for(let i = 0; i < 9; i++)
			newGenomes.push(mutate(this.genomes[order[i]]));
		newGenomes.push(randGenome());
		
		this.genomes = newGenomes;
		this.parents = newParents;
		this.numbers = newNumbers;
		this.times = [];
		this.distances = [];
		this.generation++;
	}
	else
		this.currCar++;
	this.setup();
}

game.prototype.create_box2d_world = function() {
	//5m/s2 downwards, cartesian coordinates
	let gravity = new b2Vec2(0, -5);
	
	let doSleep = false;
	let world = new b2World(gravity , doSleep);
	
	//save in global object
	this.box2d_world = world;
}

game.prototype.redraw_world = function() {
	//1. clear the canvas first - not doing this will cause tearing at world ends
	this.ctx.clearRect(0 , 0 , this.canvas_width , this.canvas_height);
	
	//dimensions in metres
	let w = this.screen_width;
	let h = this.screen_height;
	
	let absScale = Math.min(this.canvas_width/1080, this.canvas_height/720);
	let font = /*'bold '*/ + 15*absScale + 'px arial';
	let time = this.currTime + (this.currTime%2==0?'0':'');
	write_text({x : this.canvas_width - 100*absScale , y : 25*absScale , font : font , color : '#000'
		, text : 'Car' + (this.parents[this.currCar]>=0?this.parents[this.currCar]+'_':'') + this.numbers[this.currCar] + (this.parents[this.currCar]>=0?'_'+this.currCar:''), ctx : this.ctx});
	write_text({x : this.canvas_width - 100*absScale , y : 45*absScale , font : font , color : (this.currIdle>50?'#f00':(this.currDist>=50?'#0b0':'#000'))
		, text : this.currDist.toFixed(1) + ' m', ctx : this.ctx});
	write_text({x : this.canvas_width - 100*absScale , y : 65*absScale , font : font , color : (this.currTime>50?'#f00':'#000')
		, text : (this.currTime).toFixed(1) + ' s', ctx : this.ctx});
	
	write_text({x : 20*absScale , y : 25*absScale , font : font , color : '#000'
		, text : 'Generation ' + this.generation, ctx : this.ctx});
	for(let i = 0; i < this.currCar; i++){
		write_text({x : 20*absScale , y : (45+20*i)*absScale , font : font , color : '#000'
			, text : 'Car' + (this.parents[i]>=0?this.parents[i]+'_':'') + this.numbers[i] + (this.parents[i]>=0?'_'+i:'') + ': ' + (this.distances[i]).toFixed(1) + ' m, ' + (this.times[i]).toFixed(1) + ' s', ctx : this.ctx});
	}
	
	//Draw each object one by one
	for(let i in this.game_objects) {
		this.game_objects[i].draw();
	}
}

game.prototype.tick = function() {
	
	this.time_elapsed += 1;
	
	//tick all objects, if dead then remove
	for(let i in this.game_objects) {
		if(this.game_objects[i].dead == true)
			delete this.game_objects[i];
		else
			this.game_objects[i].tick();
	}
	
	//garbage collect dead things
	this.perform_destroy();
	
	//Step the box2d engine ahead
	this.box2d_world.Step(1/20 , 8 , 3);
	
	//important to clear forces, otherwise forces will keep applying
	this.box2d_world.ClearForces();
	
	//redraw the world
	this.redraw_world();
	
	if(!this.is_paused && this.on) {
		//game.fps times in 1000 milliseconds or 1 second
		this.timer = setTimeout(() =>  {this.tick();} , 1000/this.fps);
	}
	else
		this.on = true;
}

game.prototype.perform_destroy = function() {
	for(let i in this.to_destroy){
		this.to_destroy[i].destroy();
	}
}

game.prototype.get_offset = function(vector) {
	return new b2Vec2(vector.x - this.camera.x, -(vector.y - this.screen_height - this.camera.y));
}

/*game.prototype.start_handling = function() {
	let that = this;
	$(document).on('keydown.game' , function(e) {
		that.key_down(e);
		return false;
	});
	$(document).on('keyup.game' ,function(e) {
		that.key_up(e);
		return false;
	});
}
game.prototype.key_down = function(e) {
	let code = e.keyCode;
	//LEFT
	if(code == 37) {
		this.player.do_move_left = true;
	}
}

//Setup collision handler
game.prototype.setup_collision_handler = function() {
	let that = this;
	//Override a few functions of class b2ContactListener
	b2ContactListener.prototype.BeginContact = function (contact) {
		//now come action time
		let a = contact.GetFixtureA().GetUserData();
		let b = contact.GetFixtureB().GetUserData();
		if(a instanceof player && b instanceof apple) {
			that.destroy_object(b);
			that.points++;
		}
	}
}*/

//schedule an object for destruction in next tick
game.prototype.destroy_object = function(obj) {
	this.to_destroy.push(obj);
}

function randGenome() {
	let rez = [];
	for(let i = 0; i < 8*4; i++)
		rez.push(Math.random());
	return rez;
}

function mutate(genome) {
	let newGenome = [];
	for(let i = 0; i < genome.length; i++)
		newGenome.push(genome[i]);
	for(let i = 0; i < 1; i++)
		newGenome[parseInt(Math.random()*4*8)] = Math.random();
	for(let i = 0; i < 5; i++){
		let rand = Math.random()*0.2;
		let index = parseInt(Math.random()*4*8);
		if(Math.random() > 0.5){
			if(newGenome[index] - rand < 0)
				newGenome[index] += rand;
			else
				newGenome[index] -= rand;
		}
		else{
			if(newGenome[index] + rand >= 1)
				newGenome[index] -= rand;
			else
				newGenome[index] += rand;
		}
	}
	return newGenome;
}

function getOrder(distances, times){
	let order = [];
	for(let i = 0; i < 10; i++)
		order.push(i);
	for(let i = 1; i < 10; i++){
		let done = true;
		for(let j = 0; j < 10 - i; j++){
			if(distances[order[j]] >= distances[order[j+1]] + 0.1 || (Math.abs(distances[order[j]] - distances[order[j+1]]) < 0.1 && times[order[j]] < times[order[j+1]])){
				let temp = order[j];
				order[j] = order[j+1];
				order[j+1] = temp;
				done = false;
			}
		}
		if(done)
			break;
	}
	let rez = [];
	rez.push(order[9]);
	rez.push(order[9]);
	rez.push(order[8]);
	rez.push(order[8]);
	rez.push(order[7]);
	rez.push(order[7]);
	rez.push(order[6]);
	rez.push(order[5]);
	rez.push(order[4]);
	return rez;
}

//track object
function track(options) {
	this.x = options.x;
	this.y = options.y;
	this.arr = options.arr;
	
	this.game = options.game;
	this.age = 0;
	
	let bodyDef = new b2BodyDef();
	
	let fixDef = new b2FixtureDef();
	
	fixDef.shape = new b2PolygonShape;
	
	fixDef.density = 3;
	fixDef.friction = 0.8;
	fixDef.restitution = 0.1;
	fixDef.shape.SetAsArray(this.arr, this.arr.length);
	
	//set the position of the center
	bodyDef.position.Set(this.x, this.y);
	
	let body = this.game.box2d_world.CreateBody(bodyDef);
	body.CreateFixture(fixDef);
	this.body = body;
}

track.prototype.tick = function() {
	this.age++;
}

//Draw track
track.prototype.draw = function() {
	draw_body(this.body, this.game.ctx);
}

track.prototype.destroy = function()
{
	if(this.body == null)
		return;
	this.body.GetWorld().DestroyBody( this.body );
	this.body = null;
	this.dead = true;
}

//car object
function car(options) {
	this.x = options.x;
	this.y = options.y;
	
	this.game = options.game;
	this.age = 0;
	
	this.genome = options.genome;
	
	let bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.fixedRotation = false;
	
	//set the position of the center
	bodyDef.position.Set(this.x, this.y);
	
	let fixDef = new b2FixtureDef();
	fixDef.density = 4;
	fixDef.friction = 0.8;
	fixDef.restitution = 0.1;
	
	fixDef.shape = new b2PolygonShape;
	
	this.angles = [];
	this.magnitudes = [];
	this.isWheels = [];
	this.radiuses = [];
	let angle = 0;
	for(let i = 0; i < 8; i++){
		angle += Math.PI/8 + this.genome[i]*Math.PI/8;
		this.angles.push(angle);
		this.magnitudes.push(0.1 + this.genome[i + 8] * 0.9)
		this.isWheels.push(this.genome[i + 16] > 0.2?false:true);
		this.radiuses.push(0.1 + this.genome[i + 24] * 0.15);
	}
	
	let body = this.game.box2d_world.CreateBody(bodyDef);
	
	for(let i = 0; i < 8; i++){
		let arr = [new b2Vec2(0, 0),
			new b2Vec2(this.magnitudes[i]*Math.cos(this.angles[i]), this.magnitudes[i]*Math.sin(this.angles[i])),
			new b2Vec2(this.magnitudes[(i+1)%8]*Math.cos(this.angles[(i+1)%8]), this.magnitudes[(i+1)%8]*Math.sin(this.angles[(i+1)%8]))];
		
		fixDef.shape.SetAsArray(arr, 3);
		fixDef.filter.groupIndex = -1;
		body.CreateFixture(fixDef);
	}
	let bodies = [];
	bodies.push(body);
	
	//wheels
	let wFixDef = new b2FixtureDef();
	wFixDef.shape = new b2CircleShape;
	wFixDef.density = 4;
	wFixDef.friction = 0.8;
	wFixDef.restitution = 0.5;
	wFixDef.filter.groupIndex = -1;
	
	for(let i = 0; i < 8; i++){
		if(this.isWheels[i]){
			let wBodyDef = new b2BodyDef();
			wBodyDef.type = b2Body.b2_dynamicBody;
			wBodyDef.fixedRotation = false;
			wBodyDef.allowSleep = false;
			wBodyDef.position.Set(this.x + this.magnitudes[i]*Math.cos(this.angles[i]), 
				this.y + this.magnitudes[i]*Math.sin(this.angles[i]));
			
			wFixDef.shape.SetRadius(this.radiuses[i]);
			
			let wBody = this.game.box2d_world.CreateBody(wBodyDef);
			wBody.CreateFixture(wFixDef);
			
			let revoluteJointDef = new b2RevoluteJointDef();
			revoluteJointDef.enableMotor = true;
			revoluteJointDef.Initialize(body, wBody, wBodyDef.position);
			let motor = this.game.box2d_world.CreateJoint(revoluteJointDef);
			motor.SetMotorSpeed(-0.33*Math.PI / (this.radiuses[i] + 0.0));
			motor.SetMaxMotorTorque(2);
			bodies.push(wBody);
		}
	}
	this.bodies = bodies;
}

car.prototype.tick = function() {
	if(!this.game.on) return;
	this.age++;
	
	let currX = this.bodies[0].GetPosition().x - this.game.camera.x;
	let currY = this.bodies[0].GetPosition().y - this.game.camera.y;
	if(currX < this.game.minPos.x)
		this.game.camera.x += currX - this.game.minPos.x;
	if(currX > this.game.maxPos.x)
		this.game.camera.x += currX - this.game.maxPos.x;
	if(currY < this.game.minPos.y)
		this.game.camera.y += currY - this.game.minPos.y;
	if(currY > this.game.maxPos.y)
		this.game.camera.y += currY - this.game.maxPos.y;
	
	this.game.currTime = this.age/20;
	if(this.game.currTime > 60)
	{
		this.game.endRun();
		return;
	}
	currX = this.bodies[0].GetPosition().x - 3;
	if(currX > this.game.currDist){
		this.game.currDist = currX;
		this.game.currIdle = 0;
		if(currX >= 60){
			this.game.endRun();
		}
	}
	else{
		this.game.currIdle++;
		if(this.game.currIdle >= 150)
			this.game.endRun();
	}
}

//Draw car
car.prototype.draw = function() {
	draw_car(this.bodies, this.game.ctx);
}

car.prototype.destroy = function()
{
	if(this.bodies.length == 0)
		return;
	for(let i = 0; i < this.bodies.length; i++)
		this.bodies[i].GetWorld().DestroyBody( this.bodies[i] );
	this.dead = true;
}