
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
	"nope" : false
}; 

var wargame_flavour = {
	"true" : ["yes", "alright", "sure", "certainly", "absolutely", "indeed", "affirmative", "agreed", "roger" , "aye" , "yeah", "yah", "yep", "yup", "uh-huh", "okay"],
	"false" : ["no", "nope", "negative", "nay"]
}

function context() {
	this.isValid = function(cmdTokens) {
		return false;
	}

	this.command = function(userID, cmdTokens, game) {
		
	}
}

//-----------------------------------------------------------------------------
// Yes No Context
//-----------------------------------------------------------------------------
function context_yesno(yesFunc, noFunc) {
	this.isValid = function(cmdTokens) {
		for (var i = 0; i < cmdTokens.length; i++) {
			if(cmdTokens[i] === true)
				return true;
			if(cmdTokens[i] === false)
				return true;
		};

		return false;
	}

	this.command = function(userID, cmdTokens, game) {
		for (var i = 0; i < cmdTokens.length; i++) {
			if(cmdTokens[i] === true)
				{ yesFunc(userID, cmdTokens, game); return true; }
			if(cmdTokens[i] === false)
				{ noFunc(userID, cmdTokens, game); return true; }
		};

		console.log("Should not reach this point");
		return false;
	}

}

//-----------------------------------------------------------------------------
// Game Functions
//-----------------------------------------------------------------------------
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
		game.messageObj.newMessage("Your Army is Ready!", 0);
		
		game.gArmy[1].init(true, game.gMap);
		game.messageObj.newMessage("Your Army is Ready!", 1);

		game.gMap.genASCII();
	},

	"NoAIPlease" : function(useriD, cmdTokens, game) {
		game.messageObj.newMessage("Waiting for other player to Join"); 
		game.state = "battle";
	},

	"NoOp" : function(useriD, cmdTokens, game) {}
};

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
			"speed": 10 + Math.random() * 5
		};
	} 

	this.generateFoot = function() {
		return {
			"type": "Foot",
			"skill": Math.random(),
			"speed": 1 + Math.random * 3
		};
	}

	this.generateArcher = function() {
		return {
			"type": "Archer",
			"skill": Math.random(),
			"speed": 1 + Math.random * 1
		};
	}

	this.generateHorse = function() {
		return {
			"type": "Horse",
			"skill": Math.random(),
			"speed": 10 + Math.random * 1
		};
	}

	this.loadJSON = function(jo) {
		this.tentPos = jo.tentPos;
		this.units = jo.units;
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
		};			
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

		return recentGlobalMsgs.concat(recentUserMsgs).sort(function(a,b){return a[1] > b[1];}).slice(-numRecent);
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
// Local Game Init
//-----------------------------------------------------------------------------
function WarGameLogic() {

	this.processCommandLine = function(userID, cmdTokens) {
		// Lookup words in Dict
		cmdTokens = cmdTokens.map(function(a) { 
			if(a in wargame_dict)
				return wargame_dict[a];
			else
			  return ":" + a;
		});

		// Check Contexts for Action
		for (var i = this.__contextStack.length - 1; i >= 0; i--) {

			// Find Valid Context
			if(this.__contextStack[i].isValid(cmdTokens))
			{

				// Consume Command by Context
				if(this.__contextStack[i].command(userID, cmdTokens, this))
				{
					delete(this.__contextStack[i]);
					this.__contextStack = this.__contextStack.slice(0,i).concat(this.__contextStack.slice(i+1));
				}

				return true;
			}
		};

		console.log("Cannot Porcess: " + cmdTokens);
		return false;
	}

	this.command = function(user, cmd) {
		var understoodAnything = false;
		// Split Commansds into Sentance Lines then break them into word tokens
		var cmdLines = cmd.split(".").map(function(c) { return c.split(/\W/).filter(function(a) {return(a.length > 1);}).map(function(b){ return b.toLowerCase(); }); });

		var userID = this.users.indexOf(user);
		for (var i = 0; i < cmdLines.length; i++)
		{
			if(this.processCommandLine(userID, cmdLines[i]))
				understoodAnything = true;
		}

		if(understoodAnything === false)
			this.error("Cannot Process " + cmd + " from " + user);

		this.msgs = this.messageObj.procesRecentMessages(userID);
	}

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
				"msgJSON" : this.messageObj.toJSON()
			};
		}

		return {
				"users" : this.users,
				"state" : this.state,
				"gameID": this.gameID,
				"msgJSON" : this.messageObj.toJSON(),
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
	};

	this.init = function(user, gameID) {
		this.users = [user];
		this.state = "lobby";
		this.gameID = gameID;

		this.__contextStack = [];
		this.messageObj = new GameMessages();

		var userID = this.users.indexOf(user);
		this.messageObj.newMessage("New Game Created");
		this.messageObj.newMessage("_"+user+"_ joined game");
		this.messageObj.newMessage("Welcome General! \n Do you wish to begin battle with AI?", userID);
		this.__contextStack.push(new context_yesno(cmdLib.AddAIPlayer, cmdLib.NoAIPlease));


		this.msgs = this.messageObj.procesRecentMessages(userID);
	}

	return this;
}
// END OF STUPID SHIT