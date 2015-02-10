var HttpError = require('../http_error');
var winston = require('winston');
var Game = require('../models/game');

module.exports = function(router) {
	/* GET Game. */
	router.get('/game/:id', function(req, res, next) {
		var game = global.gameManager.getGame(req.params.id);
		if (game) {
			game = game.toJSON();
			game.account = req.session.account;
			res.send(game);
		} else {
			winston.error('No game for id: ' + req.params.id);
			next(new HttpError('No game for id: ' + req.params.id, HttpError.NOT_FOUND));
		}
	});

	router.put('/game/:id/status', function(req, res) {
		global.gameManager.setGameStatus(req.session.account, req.params.id, req.body.status);
		res.send({
			status : 'ok'
		});
	});

	router.post('/game/:id/message', function(req, res, next) {
		global.gameManager.addMessage(req.params.id, req.session.account, req.body.message, function(error, message) {
			if (error) {
				next(new HttpError(error));
				return;
			}
			res.send(message);
		});
	});

	router.post('/game/:id/submit', function(req, res, next) {
		res.send(global.gameManager.submit(req.session.account, req.params.id, req.body.xy, req.body.value));
	});

	router.post('/game/:id/goahead', function(req, res, next) {
		global.gameManager.goahead(req.session.account, req.params.id);
		res.send({
			status : 'ok'
		});
	});

	router.post('/game/:id/quit', function(req, res, next) {
		global.gameManager.playerQuit(req.session.account, function(error) {
			if (error) {
				// TODO handle error
			} else {
				winston.info(req.session.account + ' quits from game!!');
				res.send({
					status : 'ok'
				});
			}
		});
	});

	router.post('/game/:id/pass', function(req, res, next) {
		res.send(global.gameManager.pass(req.session.account, req.params.id));
	});
};

