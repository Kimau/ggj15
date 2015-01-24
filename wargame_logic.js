var http = require('http'),
		url = require('url'),
		level = require('level');


function checkToken(user, token) {
	return true;
}

function funcNewUser(user, pass, cb) {
	var userdb = level('./userdb');

	userdb.get(user, function(err, value) {
		if(err) {
			if(err.notFound) {
				userdb.put(user, pass);
				userdb.close();

				console.log("New User [" + user + "]");
				return cb({
					"user" : user,
					"expires" : new Date(10000000 + Date.now()).toISOString(),
					"token" : user + "_nacho"
				});
			}
			else throw err;
		}

		userdb.close(); 
		return cb("User["+user+"] already exsists");
	});

	// Async Return
}

function funcLoginUser(user, pass, cb) {
	var userdb = level('./userdb');

	userdb.get(user, function(err, value) {
		if(err) {
			if(err.notFound) {
				return cb("User[" + user + "] does not exsist");
			}
			else
				return cb(err.toString());
		}

		if(value != pass)
			return cb("Password Invalid");

		console.log("Logged in User [" + user + "]");
		return cb({
			"user" : user,
			"expires" : new Date(10000000 + Date.now()).toISOString(),
			"token" : user + "_nacho"
		});
	});

	userdb.close();
	// Async Return
}

function batchPutGame(game, gamedb) {
	var dbOps = [];
	var msgs = game.msgs;
	game.msgs = undefined;

	for (var i = 0; i < msgs.length; i++) {
		dbOps.push( {
			"type": "put", 
			"key" : "game_" + game.gameID + "_msg_" + game.numMsgs,
			"value" : msgs[i]});
		game.numMsgs += 1;
	};

	dbOps.push({"type" : "put", "key" : "game_" + game.gameID, "value" : game});
	gamedb.batch(dbOps, function(err) {
		if (err) return console.log('Batch Message PUT failed', err);
	});

	game.msgs = msgs;
}

function funcNewGame(user, token, cb) {
	if(checkToken(user, token) == false)
		return "User not Valid"

	var gamedb = level('./gamedb', {"valueEncoding":"json"});

	gamedb.get("_root", function(err,value) {
		var gameID = 0;

		if(err)
		{
			if(err.notFound) {
				console.log("Creating ROOR for game db");
				gameID = 0;
				value = { "numGames" : 1};
				gamedb.put("_root", value);
			} else
			{
				gamedb.close();
				return cb(err.toString());
			}
		}
		else
		{
			gameID = value.numGames;
			value.numGames += 1;
			gamedb.put("_root", value);
		}

		var newGame = {
			"gameID" : gameID,
			"users" : [user],
			"state" : "lobby",
			"numMsgs" : 0,
			"msgs" : [["New Game Created", "", 0, new Date().toISOString()]]
		};

		batchPutGame(newGame, gamedb);

		gamedb.get("games_for_" + user, function(err, gfValue) {
			if(err)
			{
				if(err.notFound) {
					gamedb.put("games_for_" + user, [newGame.gameID]);
				} else
				{
					gamedb.close();
					return cb(err.toString());
				}
			}
			else
			{
				gfValue.push(newGame.gameID);
				gamedb.put("games_for_" + user, gfValue);					
			}

			gamedb.close();
			console.log("New Game [" + gameID + "] Created for [" + user + "]");
			return cb(newGame);
		});

		// ASYNC 
	});

	// ASYNC Return

}

function funcGetGame(user, token, gameID, cb) {
	if(checkToken(user, token) == false)
		return "User not Valid"

	var gamedb = level('./gamedb', {"valueEncoding":"json"});
	console.log("getting game");

	gamedb.get("game_" + gameID, function(err, value) {

		console.log("game got " + [err,value]);

		if(err) {
			gamedb.close();
			return cb(err.toString());
		}

		var game = value;
		var msgOffset = Math.max(0, game.numMsgs-20);
		game.msgs = [];

		function chainedGet(err, value) {
			if(err)
			{
				gamedb.close();
				return cb(err.toString());
			}

			game.msgs.push(value);
			msgOffset += 1;
			if(msgOffset >= game.numMsgs)
			{
				gamedb.close();
				return cb(game);
			}

			gamedb.get("game_" + game.gameID + "_msg_" + msgOffset, chainedGet);
		}

		// Get Messages
		gamedb.get("game_" + game.gameID + "_msg_" + msgOffset, chainedGet);
	});

	// ASYNC Return
}

function funcPostGameCommand(user, token, gameID, command) {
	if(checkToken(user, token) == false)
		return "User not Valid"

	// TODO :: Check User is in Game

	// TODO :: Process Command

	return {
		"users" : [user, "pickle"],
		"gameID" : gameID,
		"msgs" : [["New Game Created", 0, new Date().toISOString()]]
	}	
}

// wargame_logic.js
// ========
module.exports = {
	newUser: funcNewUser,
	loginUser: funcLoginUser,
	newGame: funcNewGame,
	getGame: funcGetGame,
	postCommand: funcPostGameCommand
};