var db = require('./db');

exports.valid = false;

db.query(db.sql(function() {/*
	create table if not exists users (
		uid bigint not null auto_increment,
		name varchar(16) not null,
		password varchar(16) not null,
		primary key (uid),
		key (name)
	)
*/}), function(error) {
	if (error)
		console.log(error);
	else
		exports.valid = true;

	if (!error) {
		db.query("select * from users where name='root'",  function(error, result, fields) {
			if (!result.length) {
				db.query("insert into users (name, password) values ('PRC', '19491001')");
			}
		});
	}
});

exports.find = function(name, callback) {
	db.query("select * from users where name='" + db.dq(name) + "'", function(error, result, fields) {
		if (error)
			throw new Error(error);

		callback(result[0]);
	});
} 

exports.register = function(name, password, callback) {
	if (!name)
		return callback('没有用户名');
	if (name.length > 16)
		return callback('用户名长度必须小于等于16');
	if (!password)
		return callback('密码不能为空');
	if (password.length < 6 || password.length > 16)
		return callback('密码长度必须大于等于6小于等于16');

	exports.find(name, function(user) {
		if (user)
			return callback('用户名已经被注册了');

		db.query("insert into users (name, password) values ('" + name + "', '" + password + "')", function(error) {
			if (error)
				throw new Error(error);
			return callback();
		});
	});
}

exports.login = function(name, password, callback) {
	if (!name)
		return callback('没有用户名');
	if (!password)
		return callback('没有密码');

	exports.find(name, function(user) {
		if (!user)
			return callback('用户名不存在');

		if (user.password != password)
			return callback('密码不正确');

		callback(undefined, user);
	});
}

exports.modifyPassword = function (uid, password, callback) {
	if (!password)
		return callback('新密码不能为空');
	if (password.length < 6 || password.length > 16)
		return callback('密码长度必须大于等于6小于等于16');

	db.query("update users set password='" + db.dq(password) + "' where uid=" + uid, function(error, result, fields) {
		if (error)
			throw new Error(error);
		return callback();
	});
}
