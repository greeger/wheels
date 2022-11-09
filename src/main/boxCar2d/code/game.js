/*
	boxCar2d Game
	Made using Box2d and Jquery on the Html5 Canvas element
	
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
	
	//wntf is that
	this.scale = 50;
	
	//global array of all objects to manage
	this.game_objects = [];
	
	this.points = 0;
	this.to_destroy = [];
	this.time_elapsed = 0;
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
	
	this.screen_height = 10;
	this.scale = this.canvas_height / this.screen_height;
	this.screen_width = this.canvas_width / this.scale;
}

game.prototype.setup = function() {
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
	
	//platform
	let currX = 0;
	let currY = 1;
	for(let i = 0; i < 100; i++) {
		newY = currY + (Math.random() - 0.5) * i / 50;
		newX = currX + 1;
		this.game_objects.push(new platform({x : currX , y : currY, width : 1, height : 0.1, game : this}));
		currX = newX;
		currY = newY;
	}
	
	this.game_objects.push(new platform2({game : this}));
	
	//the player
	this.player = new player({x : w/2, y: h/2 , game : this});
	this.game_objects.push(this.player);
	
	//attach event handlers for key presses
	this.start_handling();
	
	//setup collision handler too
	this.setup_collision_handler();
}

game.prototype.create_box2d_world = function() {
	//10m/s2 downwards, cartesian coordinates remember - we shall keep slightly lesser gravity
	let gravity = new b2Vec2(0, -10);
	
	/*
		very important to do this, otherwise player will not move.
		basically dynamic bodies trying to slide over static bodies will go to sleep
	*/
	let doSleep = false;
	let world = new b2World(gravity , doSleep);
	
	//save in global object
	this.box2d_world = world;
}

//Start the game :) Setup and start ticking the clock
game.prototype.start = function() {
	this.on = true;
	this.total_points = 0;
	
	this.setup();
	this.is_paused = false;
	
	//Start the Game Loop - TICK TOCK TICK TOCK TICK TOCK TICK TOCK
	this.tick();
}

game.prototype.redraw_world = function() {
	//1. clear the canvas first - not doing this will cause tearing at world ends
	this.ctx.clearRect(0 , 0 , this.canvas_width , this.canvas_height);
	
	//dimensions in metres
	let w = this.screen_width;
	let h = this.screen_height;
	
	//let img = img_res('background.png');
	//this.ctx.drawImage(img, 0 , 0 , this.canvas_width, this.canvas_height);
	
	write_text({x : 25 , y : 25 , font : 'bold 15px arial' , color : '#000'
		, text : 'h: ' + this.canvas_height + ' w: ' + this.canvas_width + ' points: ' + this.points , ctx : this.ctx})
	
	//Draw each object one by one , the tiles , the cars , the other objects lying here and there
	for(let i in this.game_objects) {
		this.game_objects[i].draw();
	}
}

game.prototype.tick = function(cnt) {
	if(!this.is_paused && this.on) {
		this.time_elapsed += 1;
		
		//create a random fruit on top
		if(this.time_elapsed % 50 == 0) {
			let xc = Math.random() * 8 + this.screen_width/2 - 4;
			let yc = this.screen_height/2 + 2.5;
			
			this.game_objects.push(new apple({x : xc ,y : yc,game:this}));
		}
		
		//tick all objects, if dead then remove
		for(let i in this.game_objects) {
			if(this.game_objects[i].dead == true) {
				delete this.game_objects[i];
				continue;
			}
			
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
			let that = this;
			//game.fps times in 1000 milliseconds or 1 second
			this.timer = setTimeout(function() {that.tick();}  , 1000/this.fps);
		}
	}
}

game.prototype.perform_destroy = function() {
	for(let i in this.to_destroy){
		this.to_destroy[i].destroy();
	}
}

game.prototype.get_offset = function(vector) {
	return new b2Vec2(vector.x - 0, Math.abs(vector.y - this.screen_height));
}

game.prototype.start_handling = function() {
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
	//UP
	else if(code == 38) {
		this.player.jump();
	}
	//RIGHT
	else if(code == 39) {
		this.player.do_move_right = true;
	}
}

game.prototype.key_up = function(e) {
	let code = e.keyCode;
	
	//UP KEY
	if(code == 38) {
		this.player.do_move_up = false;
		this.player.can_move_up = true;
	}
	//LEFT
	else if(code == 37) {
		this.player.do_move_left = false;
	}
	//RIGHT
	else if(code == 39) {
		this.player.do_move_right = false;
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
		
		else if(b instanceof player && a instanceof apple) {
			that.destroy_object(a);
			that.points++;
		}
		//apple hits a wall
		else if(a instanceof apple && b instanceof platform) {
			that.destroy_object(a);
		}
	}
}

//schedule an object for destruction in next tick
game.prototype.destroy_object = function(obj) {
	this.to_destroy.push(obj);
}

//Apple object
function apple(options) {
	this.height = 0.25;
	this.width = 0.25;
	this.x = options.x;
	this.y = options.y;
	
	this.game = options.game;
	
	let linear_damping = 10 - (parseInt(this.game.points / 10) + 1)*0.5;
	
	let info = { 
		'density' : 10 ,
		'linearDamping' : linear_damping ,
		'fixedRotation' : true ,
		'userData' : this ,
		'type' : b2Body.b2_dynamicBody ,
	};
	
	let body = create_box(this.game.box2d_world , this.x, this.y, this.width, this.height, info);
	this.body = body;
}

//apple.img = img_res('apple.png');

apple.prototype.draw = function() {
	if(this.body == null) {
		return false;
	}
	draw_body(this.body, this.game.ctx);
	/*
	let c = this.game.get_offset(this.body.GetPosition());
	
	let scale = this.game.scale;
	
	let sx = c.x * scale;
	let sy = c.y * scale;
	
	let width = this.width * scale;
	let height = this.height * scale;
	
	this.game.ctx.translate(sx, sy);
	this.game.ctx.drawImage(apple.img , -width / 2, -height / 2, width, height);
	this.game.ctx.translate(-sx, -sy);*/
}

apple.prototype.tick = function() {
	this.age++;
	
	//destroy the apple if it falls below the x axis
	if(this.body.GetPosition().y < 0) {
		this.game.destroy_object(this);
	}
}

//Destroy the apple when player eats it
apple.prototype.destroy = function() {
	if(this.body == null) {
		return;
	}
	this.body.GetWorld().DestroyBody(this.body );
	this.body = null;
	this.dead = true;
}

/*
	Player object
	monkey art from
	http://www.vickiwenderlich.com/2011/06/game-art-pack-monkey-platformer/
*/
function player(options) {
	this.height = 1.0;
	this.width = 0.66;
	
	this.x = options.x;
	this.y = options.y;
	this.game = options.game;
	this.age = 0;
		
	this.do_move_left = false;
	this.do_move_right = false;
	this.max_hor_vel = 2;
	this,max_ver_vel = 4;
	this.can_move_up = true;
	
	let info = { 
		'density' : 10 ,
		'fixedRotation' : true ,
		'userData' : this ,
		'type' : b2Body.b2_dynamicBody ,
		'restitution' : 0.0 ,
	};
	
	let body = create_box(this.game.box2d_world , this.x, this.y, this.width, this.height, info);
	this.body = body;
}

player.prototype.tick = function() {
	if(this.is_out()) {
		//turn off the game
		this.game.on = false;
		
		start_game();
	}
	
	if(this.do_move_left) {
		this.add_velocity(new b2Vec2(-1,0));
	}
	
	if(this.do_move_right) {
		this.add_velocity(new b2Vec2(1,0));
	}
	
	if(this.do_move_up && this.can_move_up) {
		
		this.add_velocity(new b2Vec2(0,6));
		this.can_move_up = false;
	}
	
	this.age++;
}

player.prototype.add_velocity = function(vel) {
	let b = this.body;
	let v = b.GetLinearVelocity();
	
	v.Add(vel);
	
	//check for max horizontal and vertical velocities and then set
	if(Math.abs(v.y) > this.max_ver_vel) {
		v.y = this.max_ver_vel * v.y/Math.abs(v.y);
	}
	
	if(Math.abs(v.x) > this.max_hor_vel) {
		v.x = this.max_hor_vel * v.x/Math.abs(v.x);
	}
	
	//set the new velocity
	b.SetLinearVelocity(v);
}

//player.img = img_res('monkey.png');

player.prototype.draw = function() {
	if(this.body == null) {
		return false;
	}
	draw_body(this.body, this.game.ctx);
	
	/*let c = this.game.get_offset(this.body.GetPosition());
	
	let scale = this.game.scale;
	
	let sx = c.x * scale;
	let sy = c.y * scale;
	
	let width = this.width * scale;
	let height = this.height * scale;
	
	this.game.ctx.translate(sx, sy);
	this.game.ctx.drawImage(player.img , -width / 2, -height / 2, width, height);
	this.game.ctx.translate(-sx, -sy);*/
}

player.prototype.jump = function() {
	//if player is already in vertical motion, then cannot jump
	if(Math.abs(this.body.GetLinearVelocity().y) > 0.0) {
		return false;
	}
	this.do_move_up = true;
}

player.prototype.is_out = function() {
	//if player has fallen below the 0 level of y axis in the box2d coordinates, then he is out
	if(this.body.GetPosition().y < 0) {
		return true;
	}
	
	return false;
}

//platform object
function platform(options) {
	this.x = options.x;
	this.y = options.y;
	
	this.height = options.height;
	this.width = options.width;
	
	this.game = options.game;
	this.age = 0;
	//create a box2d static object - one that does not move, but does collide with dynamic objects
	
	let info = {
		'density' : 10 ,
		'fixedRotation' : true ,
		'userData' : this ,
		'type' : b2Body.b2_staticBody ,
	};
	//let body = create_polygon(this.game.box2d_world, )
	let body = create_box(this.game.box2d_world , this.x, this.y, this.width, this.height, info);
	body.SetAngle(0.25);
	this.body = body;
}

//platform.img = img_res('platform.png');
platform.prototype.tick = function() {
	this.age++;
}

//Draw bricks
platform.prototype.draw = function() {
	draw_body(this.body, this.game.ctx);
}

//platform2 object
function platform2(options) {
	this.x = 3;
	this.y = 3;
	
	this.height = 1;
	this.width = 2;
	
	this.game = options.game;
	this.age = 0;
	
	var bodyDef = new b2BodyDef();
	
	var fixDef = new b2FixtureDef();
	fixDef.density = 10;
	fixDef.friction = 1.0;
	fixDef.restitution = 0.5;
	
	fixDef.shape = new b2PolygonShape;
	
	//mention half the sizes
	fixDef.shape.SetAsBox(1, 0.5);
	
	//set the position of the center
	bodyDef.position.Set(3 , 3);
	
	let body = this.game.box2d_world.CreateBody(bodyDef);
	body.CreateFixture(fixDef);
	body.SetAngle(-0.25);
	this.body = body;
}

//platform.img = img_res('platform.png');
platform2.prototype.tick = function() {
	this.age++;
}

//Draw bricks
platform2.prototype.draw = function() {
	draw_body(this.body, this.game.ctx);
}