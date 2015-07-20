var express = require('express');
var favicon = require('serve-favicon');
var session = require('express-session');

var fs = require('fs');

var cfg = fs.readFileSync('./config.json', 'utf-8');
console.log('config.json:');
console.log(cfg);
global.config = JSON.parse(cfg);

config.port = config.port || 3000;

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/logo.png'));
app.use(session({
	secret: 'lambda x.xx',
	name:'KARELSID',
	resave: false,
	saveUninitialized: false,
	cookie: { 
		expires: new Date(2030, 1, 1)
	}
}));
app.use(express.static(__dirname + '/public'));

var router = require('./router');

app.use(router);

app.listen(config.port, function(error) {
	if (error)
		console.log(error);
	else
		console.log('Karel server listening on port ' + config.port + '.');
});
