var HttpError = require('../http_error');
var winston = require('winston');
var User = require('../models/user');

module.exports = function(router) {
	/* GET home page. */
	router.get('/', function(req, res) {
		if (req.cookies.account) {
			req.session.account = req.cookies.account;
			res.redirect('/main');
		} else {
			res.render('index', {
				error : false
			});
		}
	});

	/* GET login page. */
	router.get('/login', function(req, res) {
		if (req.session.account) {
			res.redirect('/main');
		} else {
			if (req.cookies.account) {
				req.session.account = req.cookies.account;
				res.redirect('/main');
			} else {
				res.render('index', {
					error : req.query.nouser === 'true'
				});
			}
		}
	});

	router.post('/login', function(req, res, next) {
		User.findOneByAccount(req.body.account, function(error, user) {
			if (error) {
				next(new HttpError('Error when finding user by account ' + req.body.account + ': ' + error));
				return;
			}
			if (user) {
				if (req.body.remember_me) {
					res.cookie('account', user.account, {
						maxAge : 3600000 * 24 * 30
					});
				}
				req.session.account = user.account;
				res.redirect('/main');
			} else {
				res.redirect('/login?nouser=true');
			}
		});
	});

	router.get('/logout', function(req, res) {
		req.session.account = undefined;
		res.clearCookie('account');
		res.redirect('/');
	});

	router.get('/main', function(req, res, next) {
		var game = global.gameManager.findGameByUser(req.session.account);
		if (game) {
			res.redirect('/gameroom/' + game.id);
		} else {
			User.findOneByAccount(req.session.account, function(error, user) {
				if (error) {
					next(new HttpError('Error when finding user by account ' + req.session.account + ': ' + error));
					return;
				}
				res.render('main', {
					userName : user.name
				});
			});
		}
	});

	/* GET Setting page. */
	router.get('/setting', function(req, res) {
		res.render('setting', {});
	});

	/* GET Game page. */
	router.get('/gameroom', function(req, res, next) {
		global.gameManager.playerJoin(req.session.account, function(error, game) {
			if (error) {
				next(new HttpError('Error when adding account' + req.session.account + ' to game: ' + error));
				return;
			}
			res.redirect('/gameroom/' + game.id);
		});
	});

	/* GET Game page. */
	router.get('/gameroom/:id', function(req, res) {
		res.render('game', {});
	});
};

