// Utils

Object.defineProperty(Object.prototype, 'extend', {
	value: function (obj){
		if (this === window)
			throw new Error('Cannot copy properties into global object.');

		if (typeof obj === 'object' || typeof obj === 'function') {
			for (var n in obj)
				this[n] = obj[n];
		}
	}, 
	enumerable: false,
});

var Direction = {
	None : 0x00,
	North : 0x01,
	South : 0x08,
	West : 0x10,
	East : 0x80,
	All : 0x99,
};

var o = {
	o : Direction.None,
	n : Direction.North,
	s : Direction.South,
	w : Direction.West,
	e : Direction.East,
	a :  Direction.All,
	nw : Direction.North | Direction.West,
	ne : Direction.North | Direction.East,
	sw : Direction.South | Direction.West,
	se : Direction.South | Direction.East,
};

// World
// sence : {
// 	avenues : natural,
// 	streets : natural,
// 	hasBound : boolean,
//  marks : [[an, sn, mark], ...],
// 	walls : [[an, sn, o], ... ],
//  beepers : [[an, sn, count], ... ],
//  robots : [[an, sn, name, type, facing], ...],
// }
function World(canvas, sence, options) {
	if (this === window)
		return new World(canvas, sence, ress, options);

	this.options = Object.create(World.defaultOptions);
	this.options.extend(options);

	this.options.ress = {
		tiles : Object.create(World.defaultOptions.ress.tiles), 
		items : Object.create(World.defaultOptions.ress.items), 
		spirits : Object.create(World.defaultOptions.ress.spirits)
	};

	this.avenues = sence.avenues;
	this.streets = sence.streets;

	this.sence = Array(this.streets + 1);

	for (var y = 0; y <= this.streets; y++) {
		this.sence[y] = Array(this.avenues + 1);
		for (var x = 0; x <= this.avenues; x++) {
			this.sence[y][x] = new Corner(this, x, y);
		}
	}

	this.spirits = {};

	if (sence.hasBound) {
		for (var x = 0; x <= this.avenues; x ++) {				
			this.sence[0][x].hwall = true;
			this.sence[this.streets][x].hwall = true;
		}
		for (var y = 0; y <= this.streets; y ++) {
			this.sence[y][0].vwall = true;
			this.sence[y][this.avenues].vwall = true;
		}
	}

	if (sence.marks) {
		for (var i = 0; i < sence.marks.length; i++) {
			var mark = sence.marks[i];
			this.corner(mark[0], mark[1]).mark = mark[2];
		}
	}

	if (sence.walls) {
		for (var i = 0; i < sence.walls.length; i++) {
			var wall = sence.walls[i];
			this.corner(mark[0], mark[1]).walls('build', walls[2]);
		}
	}

	if (sence.beepers) {
		for (var i = 0; i < sence.beepers.length; i++) {
			var beepers = sence.beepers[i];
			this.corner(beepers[0], beepers[1]).item('add', 'beeper', beepers[2]);
		}
	}

	if (sence.robots) {
		for (var i = 0; i < sence.robots.length; i++) {
			var robot = sence.robots[i];
			var properties = robot[3] === undefined ? {} : { facing : robot[4] };
			this.createSpirit(robot[2], robot[3], robot[0], robot[1], properties);
		}
	}

	var ress = this.options.ress;

	for (var i = 0; i < document.images.length; i++) {
		var image = document.images[i];
		if (!image.dataset.tiles)
			continue;
		var arr = eval('(' + image.dataset.tiles + ')'); 
		ress.tiles[arr.name] = new Tiles(image, arr.options);
	}

	if (options.ress) {
		if (options.ress.items) {
			for (var i = 0; i < options.ress.items.length; i++) {
				var item = options.ress.items[i];
				ress.items[item.type] = item;
			}
		}
		if (options.ress.spirits) {
			for (var i = 0; i < options.ress.spirits.length; i++) {
				var spirit = options.ress.spirits[i];
				ress.spirits[spirit.type] = spirit;
			}
		}
	}

	this.canvas = canvas;
	this.canvas.width = this.options.cornerWidth * this.avenues + this.options.edgeThickness * 2;
	this.canvas.height = this.options.cornerHeight * this.streets + this.options.edgeThickness * 2;

	this.frames = 0;
}

World.defaultOptions = {
	cornerWidth : 32,
	cornerHeight : 32,
	wallThickness : 2, 
	edgeThickness : 16,

	delay : 1000,
	defaultMark : '+',

	showframes : false,

	ress : { 
		tiles : {}, 
		items : {} , 
		spirits : {}}
};

World.prototype.antox = function(an) {
	return  an - 1; 
}

World.prototype.sntoy = function(sn) {
	return this.streets - sn; 
}

World.prototype.corner = function(an, sn) {
	var x = this.antox(an),
		y = this.sntoy(sn);

	return this.sence[y][x];
}

World.prototype.createSpirit = function(name, type, an, sn, properties) {
	if (this.spirits[name])
		throw new Error('The spirit has been created.');

	var spirit = {world: this, name : name, type : type, an : an, sn : sn};
	spirit.extend(properties);

	this.spirits[name] = spirit;

	var corner = this.corner(an, sn);
	corner.foreground[name] = spirit;

	return spirit;
} 

World.prototype.destorySpirit = function(name) {
	if (!this.spirits[name])
		throw new Error('The spirit is not existed.');

	this.spirits[name].world = null;

	delete this.spirits[name];

	delete corner.foreground[name];
}

World.prototype.spiritMoveTo = function(name, an, sn) {
	if (!this.spirits[name])
		throw new Error('The spirit is not existed.');

	var spirit = this.spirits[name];
	var corner = this.corner(spirit.an, spirit.sn);
	delete corner.foreground[name];

	spirit.an = an;
	spirit.sn = sn;

	corner = this.corner(an, sn);
	corner.foreground[name] = spirit;
}

World.prototype.update = function() {
	var ress = this.options.ress;
	for (var n in  this.spirits) {
		var obj = this.spirits[n];
		if (ress.spirits[obj.type]) {
			ress.spirits[obj.type].update(obj);
		}
	}
};

World.prototype.render = function() {
	var dc = this.canvas.getContext('2d');
	var options = this.options;
	var ress = options.ress;

	dc.save();
	dc.translate(0, options.edgeThickness);
	for (var n = this.streets; n > 0; n --) {
		options.edgeRender.render(dc, this, n, o.w);
		dc.translate(0, options.cornerHeight);
	}
	dc.restore();

	dc.save();
	dc.translate(this.avenues * options.cornerWidth + options.edgeThickness, options.edgeThickness);
	for (var n = this.streets; n > 0; n --) {
		options.edgeRender.render(dc, this, n, o.w);
		dc.translate(0, options.cornerHeight);
	}
	dc.restore();

	dc.save();
	dc.translate(0, this.streets * options.cornerHeight + options.edgeThickness);
	options.edgeRender.render(dc, this, 0, o.sw);
	dc.translate(options.edgeThickness, 0);
	for (var n = 1; n <= this.avenues; n ++) {
		options.edgeRender.render(dc, this, n, o.s);
		dc.translate(options.cornerWidth, 0);
	}
	options.edgeRender.render(dc, this, 0, o.se);
	dc.restore();

	dc.save();
	dc.translate(options.edgeThickness, options.edgeThickness);

	for (var y = 0; y < this.streets; y++) {
		for (var x = 0; x < this.avenues; x++) {
			var corner = this.sence[y][x];
			options.cornerRender.render(dc, corner);
			for (var n in corner.background) {
				var obj = corner.background[n];
				if (ress.items[obj.type]) {
					ress.items[obj.type].render(dc, obj);
				}
			}
			for (var n in corner.foreground) {
				var obj = corner.foreground[n];
				if (ress.spirits[obj.type]) {
					ress.spirits[obj.type].render(dc, obj);
				}
			}
			dc.translate(this.options.cornerWidth, 0); 
		}
		dc.translate(- this.options.cornerWidth * this.avenues, this.options.cornerHeight)
	}
	dc.restore();

	dc.save();
	options.edgeRender.render(dc, this, 0, o.nw);
	dc.translate(options.edgeThickness, 0);
	for (var n = 1; n <= this.avenues; n ++) {
		options.edgeRender.render(dc, this, n, o.n);
		dc.translate(options.cornerWidth, 0);
	}
	options.edgeRender.render(dc, this, n, o.ne);
	dc.restore();

	
	if (this.options.showframes) {
		dc.save();
		dc.fillStyle = 'blue';
		dc.font = '10px, song';
		dc.fillText(this.frames, 0, 10);
		dc.restore();
	}
		
};

World.prototype.run = function() {
	this.timer = window.setInterval(function() {
		this.update();
		this.render();
		this.frames ++;
	}.bind(this), this.options.delay);
}

World.prototype.stop = function() {
	if (this.timer) {
		window.clearInterval(this.timer);
		delete this.timer;
	}
}

World.prototype.hitTest = function(x, y) {
	if (x < this.options.edgeThickness || y < this.options.edgeThickness)
		return undefined;

	x -= this.options.edgeThickness;
	y -= this.options.edgeThickness;

	x = Math.trunc(x / this.options.cornerWidth);
	y = Math.trunc(y / this.options.cornerHeight);

	if (x > this.avenues || y > this.streets)
		return undefined;

	var an = x + 1;

	var sn = this.streets - y;

	return [an, sn];
}



// Corner

function Corner(world, x, y) {
	if (this === window)
		return new Corner(world, x, y);

	this.world = world;
	this.x = x;
	this.y = y;
	this.background = {};
	this.foreground = {};
} 

Corner.prototype.walls = function(op, walls) {
	if (arguments.length == 0) {
		op = 'get';
	}

	if (op === 'get') {
		var walls = Direction.None;
	
		if (this.world.sence[this.y][this.x].hwall)
			 walls |= Direction.North;

		if (this.world.sence[this.y + 1][this.x].hwall)
			 walls |= Direction.South;

		if (this.world.sence[this.y][this.x].vwall)
			 walls |= Direction.West;

		if (this.world.sence[this.y][this.x + 1].vwall)
			 walls |= Direction.East;

		return walls;
	}

	var eastOne = this.world.sence[this.y][this.x + 1];
	var southOne = this.world.sence[this.y + 1][this.x];

	if (op === 'set') {
		this.hwall = false;
		southOne.hwall = false;
		this.vwall = false;
		eastOne.vwall = false;
		op = 'build';
	}

	if (op !== 'build' && op !== 'destroy') 
		throw new Error('Invalid op command.');

	var b = op === 'build';

	if (walls & Direction.North)
		this.hwall = b ;

	if (walls & Direction.South)
		southOne.hwall = b;

	if (walls & Direction.West)
		this.vwall = b;

	if (walls & Direction.East)
		eastOne.vwall = b;

	return this;
} 

Corner.prototype.item = function(op, type, count) {
	if (arguments.length == 1) {
		type = op;
		op = 'get';
	}

	if (op === 'get')
		return this.background[type];

	if (op === 'remove') {
		if (count === undefined)
			count = Number.NEGATIVE_INFINITY;
		else
			count = -count;

		op = 'add';
	}

	if (op !== 'add')
		throw new Error('Invalid op command.');

	if (count === undefined)
		count = 1;

	var item = this.background[type] || (this.background[type] = { corner:this, type:type, count: 0 });

	item.count += count;

	if (item.count <= 0)
		delete this.background[type];

	return this;
}

// Corner Render

function CornerRender(options) {
	if (this === window)
		return new CornerRender(options);

	this.options = {};
	this.options.extend(CornerRender.defaultOptions);
	this.options.extend(options);
}

CornerRender.defaultOptions = {
	color : 'white',
	markColor : 'gray',
	wallColor : 'black',

	markFontFamily : 'impact',
	markFontSize : 12,
};

CornerRender.prototype.render = function(dc, corner) {
	var world = corner.world;

	dc.fillStyle = corner.color || this.options.color;
	dc.fillRect(0, 0, world.options.cornerWidth, world.options.cornerHeight);
	var mark = corner.mark === undefined ? world.options.defaultMark : corner.mark;

	if (mark !== undefined) {
		dc.fillStyle = this.options.markColor;
		dc.font = '' + this.options.markFontSize + 'px ' + this.options.markFontFamily;
		var w = dc.measureText(mark).width;
		var h = this.options.markFontSize;
		dc.fillText(mark, (world.options.cornerWidth - w) / 2, (world.options.cornerHeight + h) / 2);
	}

	dc.fillStyle = this.options.wallColor;
	if (corner.hwall) {
		dc.fillRect(0, - world.options.wallThickness / 2, world.options.cornerWidth,  world.options.wallThickness)
	}
	if (corner.vwall) {
		dc.fillRect(- world.options.wallThickness / 2, 0, world.options.wallThickness,  world.options.cornerHeight)
	}
	if (corner.y == (world.streets - 1) && world.sence[world.streets][corner.x].hwall) {
		dc.fillRect(0, world.options.cornerHeight - world.options.wallThickness / 2, world.options.cornerWidth,  world.options.wallThickness)
	}
	if (corner.x == (world.avenues - 1) && world.sence[corner.y][world.avenues].vwall) {
		dc.fillRect(world.options.cornerWidth - world.options.wallThickness / 2, 0, world.options.wallThickness,  world.options.cornerHeight)
	}
};

World.defaultOptions.cornerRender = CornerRender();

// Edge Render

function EdgeRender(options) {
	if (this === window)
		return new EdgeRender(options);

	this.options = Object.create(EdgeRender.defaultOptions);
	this.options.extend(options);
} 

EdgeRender.defaultOptions = {
	color : 'wheat',
	markColor : 'gray',
	borderColor : 'black',

	markFontFamily : 'song',
	markFontSize : 10,
};

EdgeRender.prototype.render = function(dc, world, n, location) {

	dc.fillStyle = this.options.color;
	if (location === Direction.South || location === Direction.North) {
		dc.fillRect(0, 0, world.options.cornerWidth, world.options.edgeThickness);
	} else if (location === Direction.West || location === Direction.East) {
		dc.fillRect(0, 0, world.options.edgeThickness, world.options.cornerHeight);
	} else if (location === o.ne || location === o.nw || location === o.se || location === o.sw) {
		dc.fillRect(0, 0, world.options.edgeThickness, world.options.edgeThickness)
	} else {
		throw new Error('Edge location is wrong.');
	}

	dc.fillStyle = this.options.markColor;
	dc.font = '' + this.options.markFontSize + 'px ' + this.options.markFontFamily;
	var w = dc.measureText(n).width;
	var h = this.options.markFontSize;
	if (location === Direction.South || location === Direction.North) {
		dc.fillText(n, (world.options.cornerWidth - w) / 2, (world.options.edgeThickness + h) / 2);
	} else if (location === Direction.West || location === Direction.East) {
		dc.fillText(n, (world.options.edgeThickness - w) / 2, (world.options.cornerHeight + h) / 2);
	}

	dc.fillStyle = this.options.borderColor;
	// ...

};

World.defaultOptions.edgeRender = EdgeRender();

// Tiles

function Tiles(image, options) {
	if (this === window)
		return new Tiles(image, options);

	this.image = image;

	this.options = Object.create(Tiles.defaultOptions);
	this.options.extend(options);

	if (!this.options.names)
		this.options.names = {};
}

Tiles.defaultOptions = {
	tileWidth : 30,
	tileHeight : 30,
	hcount : 1,
	vcount : 1,
};

Tiles.prototype.render = function(dc, corner, n) {
	var name = n;

	if (n == undefined)
		n = 0;

	n = Number(n);

	if (Number.isNaN(n))
		n = Number(this.options.names[name]);

	if (Number.isNaN(n))
		throw new Error('' + name + 'is not a valid tile index.');

	var sx = n % this.options.hcount,
		sy = Math.trunc(n / this.options.hcount);
	sx *= this.options.tileWidth;
	sy *= this.options.tileHeight;

	var x = corner.world.options.wallThickness / 2,
		y = corner.world.options.wallThickness / 2,
		w = corner.world.options.cornerWidth - corner.world.options.wallThickness,
		h = corner.world.options.cornerHeight - corner.world.options.wallThickness;

	dc.drawImage(this.image, sx, sy, this.options.tileWidth, this.options.tileHeight, x, y, w, h);
}

function Tile(tilesName, tileName) {
	if (this === window)
		return new Tile(tilesName, tileName);

	this.tilesName = tilesName;
	this.tileName = tileName;
}

Tile.prototype.render = function (dc, corner) {
	var tiles = corner.world.options.ress.tiles[this.tilesName];
	tiles.render(dc, corner, this.tileName);
}

function AniTile(tilesName, frames) {
	if (this === window)
		return new AniTile(tilesName, frames);

	this.tilesName = tilesName;

	this.frames = Array(frames.length);

	for (var i = 0; i < frames.length; i++) {
		if (Array.isArray(frames[i])) {
			this.frames[i] = [frames[i][0], frames[i][1]];
		} else {
			this.frames[i] = [frames[i], 1];
		}
	}

	this.index = -1;
}

AniTile.prototype.render = function (dc, corner) {
	if (this.index == -1) {
		this.index = 0;
		this.beginFrames = world.frames;
	} else {
		if (world.frames - this.beginFrames >= this.frames[this.index][1]) {
			this.index ++;
			if (this.index >= this.frames.length)
				this.index = 0;

			this.beginFrames = world.frames;
		}
	}

	var tiles = corner.world.options.ress.tiles[this.tilesName];
	tiles.render(dc, corner, this.frames[this.index][0]);
}

// Items
function Item(type, tile, options) {
	if (this === window)
		return new Item(type, tile, options);

	this.type = type;
	this.tile = tile,

	this.options = Object.create(Item.defaultOptions);
	this.options.extend(options);
}

Item.defaultOptions = {
	markColor : 'gray',
	markFontSize : 10,
	markFontFamily : 'song',
};

Item.prototype.render = function(dc, item) {

	this.tile.render(dc, item.corner);

	if (item.count > 1) {
		dc.fillStyle = this.options.markColor;
		dc.font = '' + this.options.markFontSize + 'px ' + this.options.markFontFamily;
		var w = dc.measureText(item.count).width;
		var h = this.options.markFontSize;
		dc.fillText(item.count, (world.options.cornerWidth - w) / 2, (world.options.cornerHeight + h) / 2);
	}
};

// Spirits

function RobotSpirit(type, tile, options) {
	if (this === window)
		return new RobotSpirit(type, tile, options);

	this.type = type;
	this.tile = tile,

	this.options = Object.create(RobotSpirit.defaultOptions);
	this.options.extend(options);
}

RobotSpirit.defaultOptions = {

};

var rop = {
	nop : 0,
	move : 1,
	turnLeft : 2,
	turnOff : 3,
	pickupBeeper : 4,
	putBeeper : 5,
}

RobotSpirit.prototype.update = function(robot) {
	if (!robot.insts || !robot.insts.length) 
		return;

	var inst = robot.insts.shift();

	switch(inst.op) {
		case rop.nop: {
			if (inst.callback)
				inst.callback(true);
		}
		case rop.move: {
			var an = robot.an, sn = robot.sn;
			var ok = false;
			if (robot.facing === undefined)
				robot.facing = o.e;
			ok = !(robot.world.corner(an, sn).walls() & robot.facing);
			if (ok) {
				switch (robot.facing) {
					case o.e: an++; break;
					case o.n: sn++; break;
					case o.w: an--; break;
					case o.s: sn--; break;
				}
				ok = an >= 1 && an <= robot.world.avenues && sn >= 1 && sn <= robot.world.streets;

				if (ok)
					robot.world.spiritMoveTo(robot.name, an, sn);
			}

			if (inst.callback)
				inst.callback(ok);

		} break;
		case rop.turnLeft: {
			if (robot.facing === undefined)
				robot.facing = o.e;
			switch (robot.facing) {
				case o.e: robot.facing = o.n; break;
				case o.n: robot.facing = o.w; break;
				case o.w: robot.facing = o.s; break;
				case o.s: robot.facing = o.e; break;
			}
			if (inst.callback)
				inst.callback(true);
		} break;
		case rop.turnOff: {
			robot.turnOff = true;
			if (inst.callback)
				inst.callback(true);
		} break;
		case rop.pickupBeeper: {
			var corner = robot.world.corner(robot.an, robot.sn);
			var ok = !!(corner.background['beeper']);
			if (ok)
				corner.item('remove', 'beeper', 1);

			if (inst.callback)
				inst.callback(ok);

		} break;
		case rop.putBeeper: {
			var corner = robot.world.corner(robot.an, robot.sn);
			corner.item('add', 'beeper', 1);
			if (inst.callback)
				inst.callback(true);
		} break;
		default:
			throw new Error('rop error.');
	}
}

RobotSpirit.prototype.render = function(dc, robot) {

	var options = robot.world.options;

	if (robot.facing === undefined)
		robot.facing = o.e;

	var angle = 0;

	dc.save();

	switch (robot.facing) {
		case o.n:
			angle = -90;
			break;
		case o.w:
			angle = -180;
			break;
		case o.s:
			angle = -270;
			break;
	}

	dc.translate(options.cornerWidth / 2, options.cornerHeight / 2);

	if (robot.turnOff)
		dc.scale(1, -1);

	dc.rotate(angle * Math.PI / 180.0);

	dc.translate(- options.cornerWidth / 2, - options.cornerHeight / 2);

	this.tile.render(dc, robot.world.corner(robot.an, robot.sn));

	dc.restore();
}

// Robot

function Robot(world, name, type, an, sn, facing) {
	if (this === window)
		return new Robot(world, name, type);

	if (!world.spirits[name]) {
		world.createSpirit(name, type, an, sn, { facing : facing });
	}

	this.obj = world.spirits[name];

	if (!this.obj.insts) 
		this.obj.insts = [];
}

Robot.prototype.nop = function(fn) {
	this.obj.insts.push({ op: rop.nop, callback: fn});
};

Robot.prototype.move = function(fn) {
	this.obj.insts.push({ op: rop.move, callback: fn});
};

Robot.prototype.turnLeft = function(fn) {
	this.obj.insts.push({ op: rop.turnLeft, callback: fn});
};

Robot.prototype.turnOff = function(fn) {
	this.obj.insts.push({ op: rop.turnOff, callback: fn});
};

Robot.prototype.pickupBeeper = function(fn) {
	this.obj.insts.push({ op: rop.pickupBeeper, callback: fn});
};

Robot.prototype.putBeeper = function(fn) {
	this.obj.insts.push({ op: rop.putBeeper, callback: fn});
};

