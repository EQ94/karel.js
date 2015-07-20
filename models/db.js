var mysql = require('mysql');

var db = mysql.createConnection({
	user: config.db_user,
	password: config.db_password
});

db.query('create database if not exists ' + config.db + ' default character set utf8 collate utf8_general_ci');
db.query('use ' + config.db);

db.sql = function(fn) {
	return fn.toString().split('\n').slice(1, -1).join('\n');
}

// format('xxx{1}xxx{2}...', 1, 2, ...);
db.format = function (str) {
	var args = arguments;
	var fmt = str.replace(/\{(\d+)\}/g, function (m, n) {
		return args[n];
	});
	//console.log(fmt);
	return fmt;
} 

// double quote: xxx'xxx -> xxx''xxx
db.dq = function(value) {
	if (typeof value === 'string')
		return value.replace(/'/g, "''");
	return value;
}

module.exports = db;

