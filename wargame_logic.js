var http = require('http'),
		url = require('url');

function funcNewUser(user, pass) {
	console.log("New User [" + user + "]");

	return {
		"user" : user,
		"expires" : new Date(10000000 + Date.now()).toISOString(),
		"token" : user + "_nacho"
	};
}

// wargame_logic.js
// ========
module.exports = {
	newUser: funcNewUser
};