var express = require('express');

var router = new express.Router();

// user 
var user = require('./models/user');

router.get('/user/login', function (req, res, next) {
	if (req.session.user)
		return res.end('已经登录了');

	user.login(req.query.name, req.query.password, function (error, user) {
		if (error)
			return res.end(error);

		user.isSuper = user.uid == 1;

		req.session.user = user;

		res.end('ok');
	});
});

router.get('/user/logout', function (req, res, next) {
	if (req.session.user) {
		delete req.session.user;
		return res.end('ok');
	}

	res.end('已经退出了');
});

router.get('/user/register.html', function (req, res, next) {
	res.render('register', {title:'用户注册', session: req.session});
});

router.get('/user/do/register.html', function (req, res, next) {
	if (req.query.invitation != config.invitation) {
		return res.render('echo', {title: '注册失败', message: '邀请码无效'}); 
	}
	user.register(req.query.name, req.query.password, function (error) {
		if (error)
			res.render('echo', {title: '注册失败', message: error});
		else
			res.render('echo', {title: '注册成功', message: '注册成功', jump: -2});
	});
});

router.get('/user/password', function(req, res, next) {
	if (!req.session.user)
		return res.end('没有登录');

	if (req.query.oldPassword != req.session.user.password)
		return res.end('老密码不正确');

	user.modifyPassword(req.session.user.uid, req.query.newPassword, function(error) {
		if (!error)
			req.session.user.password = req.query.newPassword;
		res.end(error || 'ok');
	})
});

// Q&A

var task = require('./models/task');

router.get('/design.html', function (req, res, next) {
	var options =  {title: '设计卡雷尔任务', session: req.session};
	if (req.query.qid) {
		task.findQ(req.query.qid, function (question) {
			if (!question)
				return res.render('echo', {title: '设计卡雷尔任务', message: '无效任务ID'});

			options.question = question;
			res.render('design', options);
		});
	} else {
		res.render('design', options);
	}
});

var helpers = require('./helpers');

router.post('/do/design.html', function (req, res, next) {
	var buffer = '';
	req.on('data', function (data) { buffer += data; });
	req.on('end', function () {
		if (!req.session.user) {
			return res.render('echo', {title: '设计卡雷尔任务', message: '没有登录'});
		}

		var data = helpers.parseMultipart(buffer);

		if (data.qid) {
			task.findQ(data.qid, function(question) {
				if (!question)
					return res.render('echo', {title: '设计卡雷尔任务', message: '无效任务ID'});

				if (!req.session.user.isSuper && question.uid != req.session.user.uid)
					return res.render('echo', {title: '设计卡雷尔任务', message: '只有作者才能对任务进行编辑'});

				task.editQ(data.qid, data.caption, data.description, data.qcode, function (error) {
					if (error)
						return res.render('echo', {title: '设计卡雷尔任务', message: error});

					res.render('echo', {title: '设计卡雷尔任务', message: '任务修改成功', jump: -2, refresh: true});
				});
			});

		} else {
			task.addQ(req.session.user.uid, data.caption, data.description, data.qcode, function (error) {
				if (error)
					return res.render('echo', {title: '设计卡雷尔任务', message: error});

				res.render('echo', {title: '设计卡雷尔任务', message: '新任务已经保存成功', jump: -2, refresh: true});
			});
		}
	});
});

router.get('/perform.html', function (req, res, next) {
	var qid = req.query.qid;
	var aid = req.query.aid;
	
	if (!qid && !aid)
		return res.render('echo', {title: '执行卡雷尔任务', message: '缺少任务ID'});

	if (aid) {
		task.findA(aid, function (answer) {
			if (!answer)
				return res.render('echo', {title: '执行卡雷尔任务', message: '任务ID无效'});

			task.findQ(answer.qid, function (question) {
				if (!question)
					return res.render('echo', {title: '执行卡雷尔任务', message: '执行代码对应的任务ID已经失效'});

				return res.render('perform', {title: '执行卡雷尔任务', session: req.session, question: question, answer: answer});
			});
		});

	} else {
		task.findQ(qid, function (question) {
			if (!question)
				return res.render('echo', {title: '执行卡雷尔任务', message: '任务ID无效'});

			return res.render('perform', {title: '执行卡雷尔任务', session: req.session, question: question});
		});
	}
});

router.post('/do/perform.html', function (req, res, next) {

	var buffer = '';
	req.on('data', function (data) { buffer += data; });
	req.on('end', function () {
		if (!req.session.user) {
			return res.render('echo', {title: '执行卡雷尔任务', message: '没有登录'});
		}

		var data = helpers.parseMultipart(buffer);

		if (data.aid) {
			task.findA(data.aid, function(answer) {
				if (!answer)
					return res.render('echo', {title: '执行卡雷尔任务', message: '无效任务执行ID'});

				if (!req.session.user.isSuper && answer.uid != req.session.user.uid)
					return res.render('echo', {title: '执行卡雷尔任务', message: '只有作者才能对任务执行代码进行编辑'});

				task.editA(data.aid, data.acode, function (error) {
					if (error)
						return res.render('echo', {title: '执行卡雷尔任务', message: error});

					res.render('echo', {title: '执行卡雷尔任务', message: '任务执行代码修改成功', jump: -2, refresh: true});
				});
			});

		} else {
			if (!data.qid) 
				return res.render('echo', {title: '执行卡雷尔任务', message: '没有任务ID'});

			task.findQ(data.qid, function (question) {
				if (!question) 
					return res.render('echo', {title: '执行卡雷尔任务', message: '无效任务ID'});

				task.addA(req.session.user.uid, data.qid, data.acode, function (error) {
					if (error)
						return res.render('echo', {title: '执行卡雷尔任务', message: error});

					res.render('echo', {title: '执行卡雷尔任务', message: '新执行代码已经保存成功', jump: -2, refresh: true});
				});
			});
		}
	});

});

// home

router.get(['/', '/index.html'], function(req, res, next) {
	var page = req.query.page || 0;

	task.countQAll(function (c) {
		var pages = Math.trunc(c / config.pageSize) + ((c %  config.pageSize) ? 1 : 0);

		if (page >= pages)
			page = pages - 1;

		if (page < 0)
			page = 0;

		task.pageQAll(page, function (questions) {

			res.render('index', {title: '卡雷尔机器人', session: req.session, pages: pages, page: page, questions: questions})
		});
	});
});

// task

router.get('/task.html', function(req, res, next) {
	if (!req.session.user)
		return res.render('echo', {title: '我的卡雷尔任务', message: '没有登录'});

	var pageQ = req.query.pageQ || 0;
	var pageA = req.query.pageA || 0;

	var act;
	if (req.session.user.isSuper) { // root user
		act = {
			countQ: task.countQAll,
			countA: task.countAAll,
			pageQ: task.pageQAll,
			pageA: task.pageAAll,
		};
	} else {
		act = {
			countQ: function (callback) { task.countQ(req.session.user.uid, callback); },
			countA: function (callback) { task.countA(req.session.user.uid, callback); },
			pageQ:  function (page, callback) { task.pageQ(req.session.user.uid, page, callback); },
			pageA:  function (page, callback) { task.pageA(req.session.user.uid, page, callback); },
		};
	}
	
	act.countQ(function (c) {
		var pagesQ = Math.trunc(c / config.pageSize) + ((c %  config.pageSize) ? 1 : 0);

		if (pageQ >= pagesQ)
			pageQ = pagesQ - 1;

		if (pageQ < 0)
			pageQ = 0;

		act.countA(function(c){
			var pagesA = Math.trunc(c / config.pageSize) + ((c %  config.pageSize) ? 1 : 0);

			if (pageA >= pagesA)
				pageA = pagesA - 1;

			if (pageA < 0)
				pageA = 0;

			act.pageQ(pageQ, function (questions) {
				act.pageA(pageA, function (answers) {
					res.render('task', {title: '我的卡雷尔任务', session: req.session, admin: true, 
						pagesQ: pagesQ, pageQ: pageQ, questions: questions, 
						pagesA: pagesA, pageA: pageA, answers: answers});
				});
			});
		});
	});	
});

router.get('/do/deleteQ.html', function (req, res, next) {
	if (!req.session.user) {
		return res.render('echo', {title: '删除卡雷尔任务', message: '没有登录'});
	}

	if (!req.query.qid) {
		return res.render('echo', {title: '删除卡雷尔任务', message: '没有任务ID'});
	}

	task.findQ(req.query.qid, function(answer) {
		if (!answer)
			return res.render('echo', {title: '删除卡雷尔任务', message: '无效任务ID'});

		if (!req.session.user.isSuper && answer.uid != req.session.user.uid)
			return res.render('echo', {title: '删除卡雷尔任务', message: '只有作者才能删除卡雷尔任务'});

		task.deleteQ(req.query.qid, function (error) {
			if (error)
				return res.render('echo', {title: '删除卡雷尔任务', message: error});

			res.render('echo', {title: '删除卡雷尔任务', message: '任务已经被删除', refresh: true});
		});
	});
});

// 404

router.get('*', function (req, res, next) {
	res.render('echo', {title: '卡雷尔机器人', message:'URL路径无效'});
});

module.exports = router;
