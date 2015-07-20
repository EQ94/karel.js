var db = require('./db');

exports.validQ = false;
exports.validA = false;


db.query(db.sql(function(){/*
	create table if not exists questions(
		qid bigint not null auto_increment,
		uid bigint not null,
		caption varchar(255) not null,
		description text not null,
		qcode text not null,
		qcts timestamp default current_timestamp,
		quts timestamp default current_timestamp on update current_timestamp,
		primary key (qid)
	)
*/}), function(error){
	if (error)
		throw new Error(error);

	exports.validQ = true;
});

db.query(db.sql(function(){/*
	create table if not exists answers(
		aid bigint not null auto_increment,
		uid bigint not null,
		qid bigint not null,
		acode text not null,
		acts timestamp default current_timestamp,
		auts timestamp default current_timestamp on update current_timestamp,
		primary key (aid)
	)
*/}), function(error){
	if (error)
		throw new Error(error);

	exports.validA = true;
});

exports.findQ = function(qid, callback) {
	var sql = "select * from questions, users where qid = " + qid + " and questions.uid = users.uid";
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]);
	});
}

exports.addQ = function (uid, caption, description, qcode, callback) {
	if (!caption) 
		return callback('任务标题不能为空');
	if (!description)
		return callback('没有任务描述');

	var sql = db.format("insert into questions (uid, caption, description, qcode) values ({1},  '{2}',  '{3}', '{4}')", 
			uid, db.dq(caption), db.dq(description), db.dq(qcode));

	db.query(sql, function (error, result, fields) {
		if (error)
			throw new Error(error);
		callback();
	})
}

exports.editQ = function (qid, caption, description, qcode, callback) {
	if (!caption) 
		return callback('任务标题不能为空');
	if (!description)
		return callback('没有任务描述');

	var sql = db.format("update questions set caption='{2}', description='{3}', qcode='{4}' where qid={1}",
		qid, db.dq(caption), db.dq(description), db.dq(qcode));

	db.query(sql, function (error, result, fields) {
		if (error)
			throw new Error(error);
		callback();
	})
}

exports.findA = function(aid, callback) {
	db.query("select * from answers, users where aid = " + aid + " and answers.uid = users.uid", function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]);
	});
}

exports.addA = function(uid, qid, acode, callback) {
	var sql = db.format("insert into answers (uid, qid, acode) values ({1}, {2}, '{3}')", uid, qid, db.dq(acode));
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback();
	})
}

exports.editA = function(aid, acode, callback) {
	var sql = db.format("update answers set acode='{2}' where aid={1}", aid, db.dq(acode));
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback();
	})
}


exports.countQAll = function (callback) {
	db.query("select count(qid) from questions", function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]['count(qid)']);
	});
}

exports.pageQAll = function (page, callback) {
	var sql = "select * from questions, users where questions.uid = users.uid order by qcts desc limit " + (page * config.pageSize) + "," + config.pageSize;
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result);
	});
}

exports.countAAll = function (callback) {
	db.query("select count(aid) from answers", function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]['count(aid)']);
	});
}

exports.pageAAll = function (page, callback) {
	var sql = "select * from answers, questions, users where answers.uid = users.uid and answers.uid = questions.uid order by acts desc limit " + (page * config.pageSize) + "," + config.pageSize;
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result);
	});
}

exports.countQ = function (uid, callback) {
	db.query("select count(qid) from questions where uid = " + uid, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]['count(qid)']);
	});
}

exports.pageQ = function (uid, page, callback) {
	var sql = "select * from questions, users where questions.uid = " + uid + " and questions.uid = users.uid order by qcts desc limit " + (page * config.pageSize) + "," + config.pageSize;
	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result);
	});
}

exports.countA = function (uid, callback) {
	db.query("select count(aid) from answers where uid = " + uid, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result[0]['count(aid)']);
	});
}

exports.pageA = function (uid, page, callback) {
	var sql = "select * from answers, questions, users where answers.uid = " + uid + 
		" and answers.uid = users.uid and answers.qid = questions.qid order by acts desc limit " + (page * config.pageSize) + "," + config.pageSize;	
	db.query(sql, function (error, result, fields) {
		if (error)
			throw new Error(error);
		callback(result);
	});
}

exports.deleteQ = function (qid, callback) {
	db.query("delete from questions where qid=" + qid, function (error, result, fields) {
		if (error)
			throw new Error(error);
		db.query("delete from answers where qid=" + qid, function (error, result, fields) {
			if (error)
				throw new Error(error);
			callback();
		});
	});
}

exports.deleteA = function (aid, callback) {
	var sql = "delete from answers where aid=" + aid;

	db.query(sql, function(error, result, fields) {
		if (error)
			throw new Error(error);
		callback();
	});
}
