var _ = require('lodash');
var Observable = require('./base/observable');
var Game = require('./models/game');
var GAME_TIMEOUT = 10 * 60 * 60 * 1000;

var GameManager = function() {
	this.$ = new Observable();
	this.games = [];
};

GameManager.prototype.playerJoin = function(account, cb) {
	var self = this;
	var lastGame = _.last(this.games);
	if (!lastGame || !(lastGame.isWaiting()) || lastGame.isFull()) {
		this.createGame(function(game) {
			setTimeout(function() {
				self.destroyGame(game.id);
			}, GAME_TIMEOUT);

			game.on('player-quit', function() {
				if (game.players.length === 0) {
					self.destroyGame(game.id);
				}
			});

			game.playerJoin(account, function(error, user) {
				cb(error, game);
			});
		});
	} else {
		lastGame.playerJoin(account, function(error, user) {
			cb(error, lastGame);
		});
	}
};

GameManager.prototype.playerQuit = function(account, cb) {
	var self = this;
	var game = this.findGameByUser(account);
	if (game) {
		game.playerQuit(account, function() {
			cb();
		});
	}
};

GameManager.prototype.submit = function(account, gameId, xy, value) {
	var self = this;
	var game = this.getGame(gameId);
	if (account === game.currentPlayer) {
		var result = game.submit(xy, value);
		if (result.over) {
			setTimeout(function() {
				self.destroyGame(gameId);
			}, 60000);
		}
		return result;
	} else {
		return {
			error : 'You do not have permission now'
		};
	}
};

GameManager.prototype.pass = function(account, gameId) {
	var game = this.getGame(gameId);
	if (account === game.currentPlayer) {
		return game.pass();
	} else {
		return {
			error : 'You do not have permission now'
		};
	}
};

GameManager.prototype.goahead = function(account, gameId) {
	this.getGame(gameId).goahead(account);
};

GameManager.prototype.addMessage = function(gameId, account, message, cb) {
	var self = this;
	var game = this.getGame(gameId);
	game.addMessage(account, message, function(error, message) {
		cb(error, message);
	});
};

GameManager.prototype.createGame = function(cb) {
	var self = this;
	var game = new Game();
	this.games.push(game);
	game.init(function() {
		self.trigger('game-created', game);
		cb(game);
	});
	return game;
};

GameManager.prototype.destroyGame = function(gameId) {
	var game = _.find(this.games, {
		'id' : gameId
	});
	if (game) {
		game.destroy();
		var index = _.findIndex(this.games, {
			'id' : gameId
		});
		this.games.splice(index, 1);
		this.trigger('game-destroyed', game);
	}
};

GameManager.prototype.getGame = function(id) {
	return _.find(this.games, {
		'id' : id
	});
};

GameManager.prototype.setGameStatus = function(account, id, status) {
	var game = this.getGame(id);
	if (game) {
		game.setStatus(account, status);
	}
};

GameManager.prototype.findGameByUser = function(account) {
	return _.find(this.games, function(game) {
		return game.findPlayer(account);
	});
};

_.merge(GameManager.prototype, Observable.general);

module.exports = GameManager;
