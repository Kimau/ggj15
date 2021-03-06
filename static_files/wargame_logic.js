
// STUPID LOCAL SHIT
var wargame_local = true;

var wargame_dict = {
	"true" : true,
	"yes" : true,
	"alright": true,
	"sure": true,
	"certainly": true,
	"absolutely": true,
	"indeed": true,
	"affirmative": true,
	"agreed": true,
	"roger" : true,
	"aye" : true,
	"yeah": true,
	"yah": true,
	"yep": true,
	"yup": true,
	"uh-huh": true,
	"okay": true,

	"false": false,
	"no" : false,
	"nay" : false,
	"nope" : false,

	"give" : ">give",
	"march" : ">march",
	"hold" : ">hold",
	"return" : ">return",
	"join" : ">join",

	"north" : [0,-1],
	"east" : [1,0],
	"south" : [0,1],
	"west" : [-1,0],

	"captain" : ".captain",
	"foot" : ".foot",
	"footmen" : ".foot",
	"archer" : ".archer",
	"bowmen" : ".archer",
	"horse" : ".horse",
	"mounted" : ".horse"
}; 

var wargame_flavour = {
	"true" : ["yes", "alright", "sure", "certainly", "absolutely", "indeed", "affirmative", "agreed", "roger" , "aye" , "yeah", "yah", "yep", "yup", "uh-huh", "okay"],
	"false" : ["no", "nope", "negative", "nay"]
}

var message_templates = {
	"captain_ready" : [
		"_{name}_ stands ready with their crest, {color1} {crest} on {color2}, flying proudly behind them",
		"{color1} {crest} stands out on _{name}_ chest as they await your orders",
		"Ready! Captain _{name}_ hold's their hand to their {color1} and {color2} crest",
		"_{name}_ the {color1} Captain fiddles with a {color2} on their lepal awaiting your pleasure",
		"_{name}_ the {crest}. They sit waiting on orders",
		"Your new captain _{name}_ holds a glass eager to depart"
	]
}

function vec_add(a,b) { return [a[0]+b[0], a[1]+b[1]]; }
function vec_sub(a,b) { return [a[0]-b[0], a[1]-b[1]]; }
function vec_div(a,b) { return [a[0]/b[0], a[1]/b[1]]; }
function vec_mul(a,b) { return [a[0]*b[0], a[1]*b[1]]; }
function vec_scale(a,l) { return [a[0]*l, a[1]*l]; }
function vec_len(a) { return Math.sqrt(a[0]*a[0] + a[1]*a[1]); }
function vec_norm(a) { var l = 1.0 / vec_len(a); return vec_scale(a,l); }
function vec_compass(a) {
	var COMPASS_DIR = [
		"east", "southeast", "south", "southwest", 
		"west", "northwest", "north", "northeast"];
	var angle = Math.atan2( a[1], a[0] );
	var octant = Math.round( 8.0 * angle / (2.0*Math.PI) + 8.0 ) % 8;
	return COMPASS_DIR[octant];
}

function MakeMessage(msg_id, data) {
	var x = randomListItem(message_templates[msg_id]);
	for (var i = 0; i < data.length; i++) {
		x = x.replace("{"+data[i][0] + "}", data[i][1]);
	};

	return x;
} 

var MOVE_TICK_TIME = 1000;

//-----------------------------------------------------------------------------
// Game Functions
//-----------------------------------------------------------------------------
function ContextStack() {
	var cmdLib = {
		"AddAIPlayer" : function(userID, cmdTokens, game) { 
			game.messageObj.newMessage("AI Added"); 
			game.state = "battle";

			game.users.push("AI");
			game.gMap = new GameMap();
			game.gMap.init(10,10);
			game.messageObj.newMessage("Map Created");

			game.gArmy = [new Army(),new Army()];
			game.gArmy[0].init(false, game.gMap);
			game.gArmy[1].init(true, game.gMap);

			game.openingArmyIntroMsg(0);
			game.openingArmyIntroMsg(1);
			
			game.gMap.genASCII();

			game.moveTickPromise = setTimeout(moveTick, MOVE_TICK_TIME, game);
		},

		"NoAIPlease" : function(useriD, cmdTokens, game) {
			game.messageObj.newMessage("Waiting for other player to Join"); 
			game.state = "battle";
		},

		"NoOp" : function(useriD, cmdTokens, game) {}
	};

	var contextTypes = {
		"YesNo" : function(userID, cmdTokens, game, context) {
			for (var i = 0; i < cmdTokens.length; i++) {
				if(cmdTokens[i] === true)
					{ cmdLib[context.yes](userID, cmdTokens, game); return true; }
				if(cmdTokens[i] === false)
					{ cmdLib[context.no](userID, cmdTokens, game); return true; }
			};

			return false;
		}
	};

	this.AddContext = function(context) {
		if(context.type in contextTypes)
			this.stack.push(context);
		else
			console.error("Unkown Type " + context);
	}

	this.handleTargetWords = function(game, unit, cmdTokens) {
		console.log("TODO");

		return { "target": [0,0] };
	}

	this.handleDirection = function(game, unit, cmdTokens) {
		var dir = [0,0];
		for(var i=0; i<cmdTokens.length; ++i)
		{
			if((typeof(cmdTokens[i]) == "object") && (cmdTokens[i].length == 2))
			{
				dir = vec_add(dir, cmdTokens[i]);
			}
		}

		dir = vec_norm(dir);
		return { "dir": dir };
	}

	this.cmdGive = function(game, userID, cmdTokens) { console.log("TODO"); return; }
	
	// FORMAL : >March UNIT (dir|:to :target)
	this.cmdMarch = function(game, userID, cmdTokens) {

		var unit = cmdTokens[1];
		if(unit.pos == undefined)
		{
			unit.pos = game.gArmy[userID].tentPos;
		}
 
		if(cmdTokens[2] == ":to")
		{
			unit.movement = this.handleTargetWords(game, unit, cmdTokens.slice(3));
			if(unit.movement)
			{
				this.messageObj.newMessage(MakeMessage("captain_ready", [
					["name", unit.name],
					["crest", unit.crest],
					["color1", unit.colours[0]],
					["color2", unit.colours[1]], 
					["dir", vec_compass(unit.movement.dir)] 
					]), userID); 
				return true; 	
			}
		}
		else
		{
			unit.movement = this.handleDirection(game, unit, cmdTokens.slice(2));
			if(unit.movement)
			{
				this.messageObj.newMessage(MakeMessage("captain_ready", [
					["name", unit.name],
					["crest", unit.crest],
					["color1", unit.colours[0]],
					["color2", unit.colours[1]], 
					["target", targetWord] 
					]), userID);
				return true; 	
			}
		}

		return false;		
	}

	this.cmdHold = function(game, userID, cmdTokens) { console.log("TODO"); return; }
	this.cmdReturn = function(game, userID, cmdTokens) { console.log("TODO"); return; }
	this.cmdJoin = function(game, userID, cmdTokens) { console.log("TODO"); return; }

	this.ProcessCmd = function(game, userID, cmdTokens) {
		for (var i = this.stack.length - 1; i >= 0; i--) {
			// Find Valid Context
			if(contextTypes[this.stack[i].type](userID, cmdTokens, game, this.stack[i]))
			{
				// Consume Command by Context
				delete(this.stack[i]);
				this.stack = this.stack.slice(0,i).concat(this.stack.slice(i+1));
				return true;
			}
		};

		switch(cmdTokens[0]) {
			case ">give":   return this.cmdGive(game, userID, cmdTokens);
			case ">march":  return this.cmdMarch(game, userID, cmdTokens);
			case ">hold":   return this.cmdHold(game, userID, cmdTokens);
			case ">return": return this.cmdReturn(game, userID, cmdTokens);
			case ">join":   return this.cmdJoin(game, userID, cmdTokens);
		}

		console.log("Cannot Process: {" + cmdTokens.join("}{") + "}");
		return false;
	}

	this.loadJSON = function(jo) {
		this.stack = jo.stack;
	}

	this.stack = [];
	return this;
}

var randomNames = [
  "Adelina",
  "Agnus",
  "Alverta",
  "Antione",
  "Becky",
  "Betsey",
  "Britteny",
  "Cari",
  "Chas",
  "Christene",
  "Danica",
  "Deann",
  "Dinorah",
  "Dustin",
  "Elaine",
  "Elinor",
  "Ethelyn",
  "Guillermina",
  "Isis",
  "Jacinto",
  "Janine",
  "Jen",
  "Jerrie",
  "Jodee",
  "Karoline",
  "Lashonda",
  "Laverna",
  "Lisha",
  "Mina",
  "Neely",
  "Nidia",
  "Noma",
  "Ozella",
  "Pok",
  "Quintin",
  "Racquel",
  "Rafaela",
  "Robert",
  "Rutha",
  "Ruthanne",
  "Sharon",
  "Shelly",
  "Silas",
  "Sudie",
  "Suzan",
  "Thu",
  "Van",
  "Victorina",
  "Willia",
  "Yuko"
]

var randomColour = [
  "Aqua",
  "Black",
  "Blue",
  "Fuchsia",
  "Gray",
  "Green",
  "Lime",
  "Maroon",
  "Navy",
  "Olive",
  "Purple",
  "Red",
  "Silver",
  "Teal",
  "White",
  "Yellow"
]

var randomCrest = [
  "Antlers",
  "Basilisk",
  "Bear",
  "Boars",
  "Cockatrice",
  "Crow",
  "Cup",
  "Dog",
  "Dragon",
  "Eagle",
  "Fish",
  "Gauntlet",
  "Greyhound",
  "Griffin",
  "Harpy",
  "Hippogriff",
  "Horse",
  "Leopard",
  "Lion",
  "Manticore",
  "Mermaid",
  "Panther",
  "Pegasus",
  "Phoenix",
  "Quill",
  "Rooster",
  "Rose",
  "Salamander",
  "Seal",
  "Serpent",
  "Swan",
  "Unicorn",
  "Wolf",
  "Wyvern"
];

function shuffleList(v){
		for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
		return v;
};

function randomListItem(l) {
	return l[Math.floor(Math.random()*l.length)];
}

function Army() {
	this.generateCaptain = function() {
		return {
			"type": "Captain",
			"name": randomListItem(randomNames),
			"colours": [randomListItem(randomColour), randomListItem(randomColour)],
			"crest": randomListItem(randomCrest),
			"speed": 10 + Math.random() * 5,
			"group": [],
			"pos" : this.tentPos
		};
	} 

	this.generateFoot = function() {
		return {
			"type": "Foot",
			"skill": Math.random(),
			"speed": 1 + Math.random() * 3
		};
	}

	this.generateArcher = function() {
		return {
			"type": "Archer",
			"skill": Math.random(),
			"speed": 1 + Math.random() * 1
		};
	}

	this.generateHorse = function() {
		return {
			"type": "Horse",
			"skill": Math.random(),
			"speed": 10 + Math.random() * 1
		};
	}

	this.idToUnit = function(id) {
		for (var i = 0; i < this.units.length; i++) {
			if(this.units[i].id == id)
				return this.units[i];
		};
	}

	this.sumTypes = function(b,a) {
		b[a.type] = 1 + (b[a.type] || 0);
		return b;
	}

	this.genSummary = function() {
		this.summary = this.units.reduce(this.sumTypes, {});

		this.summary.captainRoster = [];
		for (var i = 0; i < this.units.length; i++) {
			if(this.units[i].type == "Captain") 
					this.summary.captainRoster.push([
						this.units[i].name, 
						this.units[i].crest, 
						this.units[i].colours[0],
						this.units[i].colours[1],
						this.units[i].group.map(this.idToUnit).reduce(this.sumTypes, {})]);
		}
	}

	this.makeStyle = function(i) {
		if(this.units[i].pos)
		{
			this.units[i].debugStyle = { 
				"left" : this.units[i].pos[0] * 40 + "px",
				"top" : this.units[i].pos[1] * 40 + "px",
				"color" : this.units[i].colours[0],
				"background": this.units[i].colours[1]
				};
		}
	}

	this.loadJSON = function(jo) {
		this.tentPos = jo.tentPos;
		this.units = jo.units;
		this.genSummary();
	}

	this.init = function(isYFlipped, map) {
		var numCaptains = 5;
		var numFoot = 100;
		var numArcher = 20;
		var numHorse = 25;

		var yFlip;
		if(isYFlipped) 
			yFlip = function(a) { return map.height - a - 1; }
		else
			yFlip = function(a) { return a; }

		// Place Command Tent
		this.tentPos = [Math.random()*map.width, yFlip(0)];
		map.setTile(this.tentPos, 3);

		// Generate Army
		this.units = [];
		for (var i = 0; i < numCaptains; i++) { this.units.push(this.generateCaptain()); };
		for (var i = 0; i < numFoot; i++) { this.units.push(this.generateFoot()); };
		for (var i = 0; i < numArcher; i++) { this.units.push(this.generateArcher()); };
		for (var i = 0; i < numHorse; i++) { this.units.push(this.generateHorse()); };

		// Assign ID
		for (var i = 0; i < this.units.length; i++) {
			this.units[i].id = i;
			this.makeStyle(i);
		};			

		this.genSummary();
	}

	return this;
}

function GameMap() {
	var TILE_TYPES = [
		{ "chance": 40, "ascii": "  ", "desc" : "Grassland" },
		{ "chance": 10, "ascii": "\u2229\u2229", "desc" : "Hills", "fx" : [["archer",1], ["movement",0.3]] },
		{ "chance":  2, "ascii": "\u2248\u2248", "desc" : "Lake", "fx": [["unpassable",1]]},
		{ "chance":  0, "ascii": "/\\", "desc" : "Tent"}
	]

	this.getTileTypeInfo = function(i) {
		return TILE_TYPES[i];
	} 

	this.getTile = function(p) {
		var i = parseInt(p[0]) + parseInt(p[1]*this.width);
		if((i<0)||(i>=this.maxTiles))
			return console.error("Out of Range");
		return this.tile[i];
	}

	this.setTile = function(p,v) {
		var i = parseInt(p[0]) + parseInt(p[1]*this.width);
		if((i<0)||(i>=this.maxTiles))
			console.error("Out of Range");
		this.tile[i] = v;
	}

	this.genASCII = function() {
		this.ascii = "\u2554";
		for (var i = 0; i < this.width; i++)
			this.ascii += "\u2550\u2550"; 
		this.ascii += "\u2557\n"; 
		for (var i = 0; i < this.maxTiles; i++) {
			if((i % this.width) == 0)
				this.ascii += "\u2551";
			this.ascii += TILE_TYPES[this.tile[i]].ascii;
			if(((i+1) % this.width) == 0)
				this.ascii += "\u2551\n"; 
		}
		this.ascii += "\u255a"; 
		for (var i = 0; i < this.width; i++)
			this.ascii += "\u2550\u2550"; 
		this.ascii += "\u255d"; 
	}

	this.toJSON = function() {
		return [this.width, this.height, Array.prototype.slice.call(this.tile)]
	}

	this.loadJSON = function(jo) {
		this.width = jo[0];
		this.height = jo[1];
		this.maxTiles = this.width * this.height;
		this.tile = new Uint8Array(jo[2]);
		this.genASCII();
	}

	this.init = function(width, height) {
		this.width = width;
		this.height = height;
		this.maxTiles = width * height;

		var totalChance = 0;
		var maxTileID = TILE_TYPES.length;
		for (var i = 0; i < maxTileID; i++) {
			 totalChance += TILE_TYPES[i].chance;
		};

		tArr = new Uint8Array(this.maxTiles);
		for (var i = 0; i < this.maxTiles; i++) {
			var x = Math.random() * totalChance;
			var tileID = 0;
			for (tileID = 0; (tileID < maxTileID) && (x > TILE_TYPES[tileID].chance); tileID++)
				x -= TILE_TYPES[tileID].chance;

			if(tileID < maxTileID)
				tArr[i] = tileID; 
		};

		this.tile = tArr;
		this.genASCII();
	}

	return this;
}

function GameMessages() {
	this.newMessage = function(text, userID) {
		var msg = [text, new Date()];
		if(userID)
			this.userMsgs[userID].push(msg);
		else
			this.globalMsgs.push(msg);
	}

	this.procesRecentMessages = function(userID, numRecent) {
		numRecent = numRecent || 20;
		var recentGlobalMsgs = this.globalMsgs.slice(-numRecent);
		var recentUserMsgs = this.userMsgs[userID].slice(-numRecent);

		var msgPack = recentGlobalMsgs.concat(recentUserMsgs);
		msgPack = msgPack.sort(function(a,b){
			return +(a[1] > b[1]) || +(a[1] === b[1]) - 1;
		});
		msgPack = msgPack.slice(-numRecent);

		msgPack = msgPack.map(function(a){
			return '<span class="date">' +
			new Date(a[1]).toTimeString().replace(/:.. .*/g,"") +
			'</span><span class="msg">' +
			a[0].replace(/_([^_]*)_/g,'<span class="name">$1</span>') +
			'</span>';
		});

		return msgPack;
	}

	this.toJSON = function() {
		return {
			"globalMsgs" : this.globalMsgs,
			"userMsgs0" : this.userMsgs[0],
			"userMsgs1" : this.userMsgs[1]
		}; 
	}

	this.loadJSON = function(jo) {
		this.globalMsgs = jo.globalMsgs.map(function(a) { return [a[0],new Date(a[1])]; });
		this.userMsgs = [
			jo.userMsgs0.map(function(a) { return [a[0],new Date(a[1])]; }),
			jo.userMsgs1.map(function(a) { return [a[0],new Date(a[1])]; })];
	}

	this.globalMsgs = [];
	this.userMsgs = [[],[]];

	return this;
}

//-----------------------------------------------------------------------------
// Move Tick
//-----------------------------------------------------------------------------
function moveTick(game) {
	for (var i = 0; i < game.gArmy[0].units.length; i++) {
		var u = game.gArmy[0].units[i];
		if(u.movement && u.pos)
		{
			if(u.movement.dir)
				u.pos = vec_add(u.pos, vec_scale(u.movement.dir, u.speed * 0.01));

			game.gArmy[0].makeStyle(i);
		}
	};

	game.moveTickPromise = setTimeout(moveTick, MOVE_TICK_TIME, game);
};


//-----------------------------------------------------------------------------
// Local Game Init
//-----------------------------------------------------------------------------
function WarGameLogic() {

	this.processCommandLine = function(userID, cmdTokens) {
		// Lookup words in Dict
		var game = this;
		cmdTokens = cmdTokens.map(function(a) { 
			if(a in wargame_dict)
				return wargame_dict[a];
			else if(a.match(/^[0-9]*$/g))
				return parseInt(a);
			else if(game.isCaptName(userID, a))
				return game.lastUnitSearch;
			else
			  return ":" + a;
		}); 

		// Check Contexts for Action
		if(this.context.ProcessCmd(this, userID, cmdTokens))
			return true;

		return false;
	}

	this.command = function(user, cmd) {
		var understoodAnything = false;
		// Split Commansds into Sentance Lines then break them into word tokens
		var cmdLines = cmd.split(".").map(function(c) { return c.split(/\W/).filter(function(a) {return(a.length > 0);}).map(function(b){ return b.toLowerCase(); }); });

		var userID = this.users.indexOf(user);
		for (var i = 0; i < cmdLines.length; i++)
		{
			if(this.processCommandLine(userID, cmdLines[i]))
				understoodAnything = true;
		}

		if(understoodAnything === false)
			this.messageObj.newMessage("I don't understand you.")

		this.msgs = this.messageObj.procesRecentMessages(userID);
	}

	this.isCaptName = function(userID, unit_name) {
		this.lastUnitSearch = this.getCaptainByName(userID, unit_name);
		return (this.lastUnitSearch)?true:false;
	}

	this.getCaptainByName = function(userID, unit_name) {
		return hackScope.game.gArmy[userID].units.filter(
			function(a){ return (a.name !== undefined) && (a.name.toLowerCase() == unit_name); })[0];
	};

	this.openingArmyIntroMsg = function(userID) {
		this.messageObj.newMessage("Your Army is Ready!", userID);

		var sumObj = this.gArmy[userID].summary;
		this.messageObj.newMessage("You have " + 
			sumObj["Captain"] + " captains, " + 
			sumObj["Horse"] + " horse, " + 
			sumObj["Archer"] + " archers, and " + 
			sumObj["Foot"] + " foot", userID);

		for (var i = 0; i < sumObj.captainRoster.length; i++) {

			this.messageObj.newMessage(MakeMessage("captain_ready", [
				["name", sumObj.captainRoster[i][0]],
				["crest", sumObj.captainRoster[i][1]],
				["color1", sumObj.captainRoster[i][2]],
				["color2", sumObj.captainRoster[i][3]] 
				]), userID);
/*
			this.messageObj.newMessage("The enemy is to the " + 
			(userID==0)?"south":"north" + 
			". _Give_ us our troops and we shall _march_ on them.", userID); */
		};
	};

	this.refresh = function(user) {
		var userID = this.users.indexOf(user);
		this.msgs = this.messageObj.procesRecentMessages(userID);
	}

	this.error = function(msg) {
		console.error(msg);
	};

	this.toJSON = function() {
		if(this.state == "lobby")
		{
			return {
				"users" : this.users,
				"state" : this.state,
				"gameID": this.gameID,
				"msgJSON" : this.messageObj.toJSON(),
				"context" : this.context
			};
		}

		return {
				"users" : this.users,
				"state" : this.state,
				"gameID": this.gameID,
				"msgJSON" : this.messageObj.toJSON(),
				"context" : this.context,
				"mapJSON" : this.gMap.toJSON(),
				"armyJSON" : [this.gArmy[0], this.gArmy[1]]
			};
	};

	this.loadJSON = function(jo) {
		this.users = jo.users;
		this.state = jo.state;
		this.gameID = jo.gameID;
		this.messageObj = new GameMessages();
		this.messageObj.loadJSON(jo.msgJSON);
		this.context = new ContextStack();
		this.context.loadJSON(jo.context);

		if(this.state == "lobby")
		{
			delete(this.gMap);
			delete(this.gArmy);
			return;
		}

		this.gMap = new GameMap();
		this.gMap.loadJSON(jo.mapJSON);
		this.gArmy = [new Army(),new Army()];
		this.gArmy[0].loadJSON(jo.armyJSON[0]);
		this.gArmy[1].loadJSON(jo.armyJSON[1]);

		// Start Timers
		this.moveTickPromise = setTimeout(moveTick, MOVE_TICK_TIME, this);
	};

	this.init = function(user, gameID) {
		this.users = [user];
		this.state = "lobby";
		this.gameID = gameID;

		this.context = new ContextStack();
		this.messageObj = new GameMessages();

		var userID = this.users.indexOf(user);
		this.messageObj.newMessage("New Game Created");
		this.messageObj.newMessage("_"+user+"_ joined game");
		this.messageObj.newMessage("Welcome General! \n Do you wish to begin battle with AI?", userID);
		this.context.AddContext({type:"YesNo", "yes": "AddAIPlayer", "no": "NoAIPlease"});

		this.msgs = this.messageObj.procesRecentMessages(userID);
	}

	return this;
}
// END OF STUPID SHIT