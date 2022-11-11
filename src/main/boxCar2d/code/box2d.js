/*
	box2d docs at
	http://www.box2dflash.org/docs/2.1a/reference/
*/

//Generic function to draw a box2d body , with a given shape on a given context
function draw_shape(body , shape, color1, color2, context) {
	context.strokeStyle = color1;
	context.lineWidth = 1;
	let scale = global_game.scale;
	
	context.fillStyle = color2;
	
	context.beginPath();
	switch (shape.GetType()) {
		//A polygon type shape like a square , rectangle etc
		case b2Shape.e_polygonShape: {
			let vert = shape.GetVertices();
			let position = body.GetPosition();
			
			let tV = position.Copy();
			let a = vert[0].Copy();
			a.MulM( body.GetTransform().R );
			
			tV.Add(a);
			
			let _v = global_game.get_offset(tV);
			
			let _x = _v.x;
			let _y = _v.y;
			
			context.moveTo(_x * scale, _y * scale);
			
			for (let i = 0; i < vert.length; i++) {
				//Get a copy of the vertice
				let v = vert[i].Copy();
				
				//Rotate the vertice
				v.MulM( body.GetTransform().R );
				
				v.Add(position);
				
				//Subtract the camera coordinates to get relative offsets
				let _v = global_game.get_offset(v);
				
				let _x1 = _v.x;
				let _y1 = _v.y;

				//Draw line to the new point
				context.lineTo( _x1 * scale , _y1  * scale);
			}
			context.lineTo(_x * scale, _y * scale);
			break;
		}
		//A circle type shape
		case b2Shape.e_circleShape: {
			let r = shape.GetRadius();
			let position = body.GetPosition();
			
			let tV = position.Copy();
			let a = shape.GetLocalPosition().Copy();
			a.MulM( body.GetTransform().R );
			tV.Add(a);
			
			let _v = global_game.get_offset(tV);
			
			let _x = _v.x;
			let _y = _v.y;
			context.ellipse(_x * scale, _y * scale, r * scale, r * scale, 0, 0, 2 * Math.PI);
			for(let i = 0; i < 2; i++){
				context.moveTo(_x * scale, _y * scale);
				let angle = Math.PI * i - body.GetAngle();
				context.lineTo(_x * scale + r * scale * Math.cos(angle), _y * scale + r * scale * Math.sin(angle));
			}
			break;
		}
	}
	context.fill();
	context.stroke();
	
}

//Draw a body by drawing all the shapes of its fixtures
function draw_body(b, context) {	
	for( let f = b.GetFixtureList() ; f != null ; f = f.GetNext()) {
		let shape = f.GetShape();
		//draw the shape finally
		draw_shape(b , shape, "rgb(100, 100, 100, 100%)", "rgb(200, 200, 200, 100%)", context);
	}
}

//Draw a body by drawing all the shapes of its fixtures
function draw_car(b, context) {
	for( let f = b[0].GetFixtureList() ; f != null ; f = f.GetNext()) {
		let shape = f.GetShape();
		//draw the shape finally
		draw_shape(b[0] , shape, "rgb(100, 100, 100, 100%)", "rgb(150, 250, 150, 100%)", context);
		
	}
	for(let i = 1; i < b.length; i++) {
		for( let f = b[i].GetFixtureList() ; f != null ; f = f.GetNext()) {
			let shape = f.GetShape();
			//draw the shape finally
			draw_shape(b[i] , shape, "rgb(100, 100, 100, 100%)", "rgb(150, 150, 250, 50%)", context);
		}
	}
}
