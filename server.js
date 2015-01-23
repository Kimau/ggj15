var http = require('http'),
		url = require('url'),
		path = require('path'),
		fs = require('fs'),
		zlib = require('zlib'),
		wargame = require('./wargame_logic.js');

var mimeTypes = {
		"html": "text/html",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"png": "image/png",
		"js": "application/javascript",
		"css": "text/css"};

// ------------------------------------------------------------------------------
// Helper Functions
function makeError(res, msg) {
	res.writeHead(400, "text/plain");
	res.write(msg);
	res.end();
}

function makeJSON(res, obj) {
	res.writeHead(200, "text/json");
	res.write(JSON.stringify(obj));
	res.end();
}

function makeBin(res, u8array) { // expect Uint8Array
	res.writeHead(200, {
	"Content-Type": "application/octet-stream",
	"Content-length": u8array.length,
	"Content-transfer-encoding": 'binary' });
	res.write(new Buffer(u8array));
	res.end();
}

function ServeFile(filename, res, req)
{
	filename = "static_files/" + filename;

	fs.exists(filename, function(exists) {
		if(exists) {		
			// Request Head
			var acceptEncoding = req.headers['accept-encoding'];
			if (!acceptEncoding) { acceptEncoding = ''; }

			// Mime Head
			var ext = path.extname(filename).split(".")[1];
			var mimeType = "text/plain";
			if(ext in mimeTypes)
				mimeType = mimeTypes[ext];
			

			// Pipe FS
			var fileStream = fs.createReadStream(filename);

			if (acceptEncoding.match(/\bdeflate\b/)) {
				res.writeHead(200, { 'content-type' : mimeType, 'content-encoding': 'deflate' });
				fileStream.pipe(zlib.createDeflate()).pipe(res);
			} else if (acceptEncoding.match(/\bgzip\b/)) {
				res.writeHead(200, { 'content-type' : mimeType, 'content-encoding': 'gzip' });
				fileStream.pipe(zlib.createGzip()).pipe(res);
			} else {
				res.writeHead(200, { 'content-type' : mimeType });
				fileStream.pipe(res);
			}
		}
		else
		{
			console.log("not exists: " + filename);
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write('404 Not Found\n');
			res.end();
		}
	}); //end path.exists
}

/******************************************************************************
			Wargame 
******************************************************************************/
function wargameResult(res, obj) {
	if(typeof(obj) == "string")
		return makeError(res, obj);

	return makeJSON(res, obj);
}

function wargameAPIRouter(res, req) {
	req.jsonObj = "ERROR";

	if(req.method == "POST") {
		// POST METHOD
		switch(req.url) {
			case "/warapi/new_user":
				req.on('data', function(chunk) {
					console.log("BODY:" + chunk);
					req.jsonObj = wargame.newUser("test", "pass");
				});

				req.on('end', function() {
					console.log("END");
					wargameResult(res, req.jsonObj);
				})

				console.log("START");
			break;

			default:
				return makeError(res, "Unknown Endpoint - " + req.url);
		};
	}
	else if(req.method == "GET") {
switch(req.url) {
			case "/warapi/new_user":
				res.on('data', function(chunk) {
					console.log("BODY:" + chunk);
					wargameResult(res, wargame.newUser("test", "pass"));
				});
			break;

			default:
				return makeError(res, "Unknown Endpoint - " + req.url);
		};	
	}
}

/******************************************************************************
			Start Server
******************************************************************************/
http.createServer(function (req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.relative("/", uri);

	if(uri == '/')
	{
		return ServeFile("index.html", res, req);
	}

	if(uri.indexOf("/warapi/") == 0)
	{
		wargameAPIRouter(res, req)
		return;
	}

	// Serve File
	ServeFile(filename, res, req);
	// exits but still waiting on callback

}).listen(1337);
console.log('Server running on port 1337');