var _ = require('lodash');
var winston = require('winston');
var Observable = require('../base/observable');
var Rule = require('./rule');
var User = require('./user');
var Puzzle = require('./puzzle');
var GameMode = require('./game_mode');
var WAITING = "waiting";
var LOADING = "loading";
var ONGOING = "ongoing";
var DESTROYED = "destroyed";
var OVER = "over";
var PREFIX = "game";
var CAPACITY = 9;
var COUNTDOWN_TOTAL = 5;
var QUIT_COUNTDOWN_TOTAL = 20;
var MAX_TIMEOUT_ROUNDS = 10;
var PROPS = {
	magnifier : 99,
	impunity : 10,
	delay : 10
};

var SCORE_TYPE = {
	INCORRECT : "incorrect",
	CORRECT : "correct",
	TIMEOUT : "timeout",
	PASS : "pass",
	IMPUNITY : "impunity"
};

var Game = function(mode) {
	this.$ = new Observable();
	this.id = PREFIX + Date.now();
	this.players = [];
	this.messages = [];
	this.status = WAITING;
	this.mode = mode || GameMode.MODE9;
	this.initCellValues = {};
	this.userCellValues = {};
	this.knownCellValues = {};
	this.scores = {};
	this.timeoutCounter = {};
	this.timeoutTimer = {};
	this.props = {};
	this.changedScores = {};
};

Game.prototype.isWaiting = function() {
	return this.status === WAITING;
};

Game.prototype.setStatus = function(account, status) {
	var oldStatus = this.status;
	this.status = status;
	this.trigger('status-changed', status, oldStatus);
	var self = this;
	if (oldStatus === WAITING && status === LOADING) {
		var player = self.findPlayer(account);
		Puzzle.findRandomOneByLevel(Puzzle.LEVELS[parseInt(player.grade)], function(error, puzzle) {
			if (error) {
				// TODO handle error.
				winston.error(error);
			} else {
				puzzleJson = puzzle.toJSON();
				self.initCellValues = puzzleJson.question;
				self.answer = puzzleJson.answer;
				self.trigger('puzzle-init', self.initCellValues);
				var countdown = COUNTDOWN_TOTAL;
				var countDownTimer = setInterval(function() {
					if (countdown >= 0) {
						self.trigger('countdown-stage', countdown);
						countdown--;
					} else {
						clearInterval(countDownTimer);
						setTimeout(function() {
							self.start();
						}, 5000);
						self.status = ONGOING;
						self.trigger('status-changed', self.status, status);
					}
				}, 1000);
			}
		});
	}
};

Game.prototype.goahead = function(account) {
	if (this.timeoutTimer[account]) {
		clearInterval(this.timeoutTimer[account]);
		this.timeoutCounter[account] = 0;
	}
};

Game.prototype.start = function() {
	this.nextPlayer();
};

Game.prototype.nextPlayer = function() {
	var self = this;
	this.stopPlayerTimer();
	if (this.currentPlayer) {
		var playerIndex = _.findIndex(this.players, function(player) {
			return player.account === self.currentPlayer;
		});
		this.currentPlayer = this.players[++playerIndex % this.players.length].account;
	} else {
		this.currentPlayer = this.players[0].account;
	}
	this.trigger('switch-player', this.currentPlayer);
	setTimeout(function() {
		self.playerTimer = {
			ellapsedTime : 0
		};
		self.trigger('ellapsed-time', self.playerTimer.ellapsedTime);
		self.playerTimer.timer = setInterval(function() {
			if (!self.playerTimer.stopped) {
				self.playerTimer.ellapsedTime++;
				self.trigger('ellapsed-time', self.playerTimer.ellapsedTime);
				if (self.playerTimer.ellapsedTime === self.rule.add.total) {
					var currentPlayer = self.currentPlayer;
					self.stopPlayerTimer();
					self.updateScore(SCORE_TYPE.TIMEOUT);
					if (self.timeoutCounter[currentPlayer] === undefined) {
						self.timeoutCounter[currentPlayer] = 0;
					}
					self.timeoutCounter[currentPlayer]++;
					if (self.timeoutCounter[currentPlayer] >= MAX_TIMEOUT_ROUNDS) {
						self.trigger('max-timeout-reached', currentPlayer);
						var countdown = QUIT_COUNTDOWN_TOTAL;
						self.timeoutTimer[currentPlayer] = setInterval(function() {
							countdown--;
							if (countdown > 0) {
								self.trigger('quit-countdown-stage', currentPlayer, countdown);
							} else {
								clearInterval(self.timeoutTimer[currentPlayer]);
								self.playerQuit(currentPlayer);
							}
						}, 1000);
					}
					self.nextPlayer();
				}
			}
		}, 1000);
	}, 1000);
};

Game.prototype.updateScore = function(type, xy) {
	var rule = this.rule,
	    score = 0,
	    account = this.currentPlayer;
	if (type === SCORE_TYPE.CORRECT) {
		var time = this.playerTimer.ellapsedTime;
		score = _.find(rule.add.levels, function(level) {
			return time >= level.from && time < level.to;
		}).score;
	} else if (type === SCORE_TYPE.INCORRECT || type === SCORE_TYPE.TIMEOUT) {
		score = -(rule.reduce.timeout);
	} else if (type === SCORE_TYPE.PASS) {
		score = -(rule.reduce.pass);
	} else if (type === SCORE_TYPE.IMPUNITY) {
		if (this.changedScores[account] && this.changedScores[account].changed < 0) {
			score = -this.changedScores[account].changed;
		}
	}
	if (score !== 0) {
		var oldScore = this.scores[account] || 0;
		this.scores[account] = oldScore + score;
		this.changedScores[account] = {
			score : this.scores[account],
			changed : score,
			type : type,
			xy : xy
		};
		this.trigger('score-changed', account, this.changedScores[account]);
	}
	return score;
};

Game.prototype.stopPlayerTimer = function() {
	if (this.playerTimer) {
		this.playerTimer.stopped = true;
		if (this.playerTimer.timer) {
			clearInterval(this.playerTimer.timer);
		}
	}
};

Game.prototype.playerJoin = function(account, cb) {
	var self = this;
	User.findOneByAccount(account, function(error, user) {
		if (error) {
			cb(error);
		} else {
			self.players.push(user);
			self.props[user.account] = _.cloneDeep(PROPS);
			self.knownCellValues[user.account] = {};
			self.trigger('player-joined', user.toJSON());
			cb(null, user);
		}
	});
};

Game.prototype.playerQuit = function(account, cb) {
	if (this.players.length > 1) {
		if (this.currentPlayer === account) {
			this.nextPlayer();
		}
	} else {
		this.stopPlayerTimer();
	}
	_.remove(this.players, function(player) {
		return player.account === account;
	});
	delete this.props[account];
	delete this.knownCellValues[account];
	this.trigger('player-quit', account);
	// TODO write back score to user
	if (cb) {
		cb();
	}
};

Game.prototype.addMessage = function(account, message, cb) {
	var self = this;
	User.findOneByAccount(account, function(error, user) {
		if (error) {
			cb(error);
		} else {
			message = {
				from : user.name,
				content : message
			};
			self.messages.push(message);
			self.trigger('message-added', message);
			cb(null, message);
		}
	});
};

Game.prototype.isOver = function() {
	var over = true;
	for (xy in this.answer) {
		over = over && ((this.userCellValues[xy] || this.initCellValues[xy]) === this.answer[xy]);
		if (!over) {
			break;
		}
	}
	return over;
};

Game.prototype.isFull = function() {
	return this.players.length >= CAPACITY;
};

Game.prototype.toJSON = function(account) {
	return {
		id : this.id,
		mode : this.mode,
		rule : this.rule,
		initCellValues : this.initCellValues,
		userCellValues : this.userCellValues,
		players : this.players.map(function(player) {
			return player.toJSON();
		}),
		currentPlayer : this.currentPlayer,
		messages : this.messages,
		scores : this.scores,
		status : this.status,
		account : account ? account : undefined,
		props : account ? this.props[account] : this.props,
		knownCellValues : account ? this.knownCellValues[account] : this.knownCellValues
	};
};

Game.prototype.findPlayer = function(account) {
	return _.find(this.players, function(player) {
		return player.account === account;
	});
};

Game.prototype.submit = function(account, xy, value, cb) {
	this.timeoutCounter[account] = 0;
	if (account === this.currentPlayer) {
		value = parseInt(value);
		this.stopPlayerTimer();
		var result = {};
		var over = false;
		if (this.answer[xy] === value) {
			this.userCellValues[xy] = value;
			for (key in this.knownCellValues) {
				delete this.knownCellValues[key][xy];
			}
			this.trigger('cell-correct', xy, value);
			result.score = this.updateScore(SCORE_TYPE.CORRECT, xy);
			over = this.isOver();
			result.success = true;
		} else {
			this.trigger('cell-incorrect', xy);
			result.score = this.updateScore(SCORE_TYPE.INCORRECT, xy);
			result.success = false;
		}
		if (over) {
			result.over = true;
			this.status = OVER;
			this.trigger('game-over');
		} else {
			this.nextPlayer();
		}
		cb(null, result);
	} else {
		cb('You do not have permission now');
	}
};

Game.prototype.autoSubmit = function(account, xy, cb) {
	var self = this;
	var props = this.props[account];
	if (props.magnifier > 0) {
		var value = this.answer[xy];
		this.submit(account, xy, value, function(error, result) {
			if (error) {
				cb(error);
			} else {
				props.magnifier--;
				self.trigger('magnifier-changed', props.magnifier);
				cb(null, result);
			}
		});
	} else {
		cb('You do not have enough magnifiers');
	}
};

Game.prototype.impunish = function(account, cb) {
	if (account === this.currentPlayer) {
		var props = this.props[account];
		if (props.impunity > 0) {
			props.impunity--;
			this.updateScore(SCORE_TYPE.IMPUNITY);
			cb(null);
		} else {
			cb('You do not have enough impunities');
		}
	} else {
		cb('You do not have permission now');
	}
};

Game.prototype.peep = function(account, xy, cb) {
	this.timeoutCounter[account] = 0;
	var self = this;
	var props = this.props[account];
	if (props.magnifier > 0) {
		this.knownCellValues[account][xy] = this.answer[xy];
		props.magnifier--;
		cb(null, this.knownCellValues[account][xy]);
	} else {
		cb('You do not have enough magnifiers');
	}
};

Game.prototype.pass = function(account, cb) {
	this.timeoutCounter[account] = 0;
	if (account === this.currentPlayer) {
		this.stopPlayerTimer();
		var score = this.updateScore(SCORE_TYPE.PASS);
		this.nextPlayer();
		cb(null, {
			success : true,
			score : score
		});
	} else {
		cb('You do not have permission now');
	}
};

Game.prototype.init = function(cb) {
	var self = this;
	Rule.getRule(function(error, rule) {
		if (error) {
			cb(error);
		} else {
			var ruleJSON = rule.toJSON();
			ruleJSON.add = _.find(ruleJSON.add, function(e) {
				return e.selected;
			});
			self.rule = ruleJSON;
			cb();
		}
	});
};

Game.prototype.destroy = function() {
	this.stopPlayerTimer();
	delete this.players;
	delete this.messages;
	this.status = DESTROYED;
	delete this.mode;
	delete this.initCellValues;
	delete this.userCellValues;
	delete this.scores;
	this.trigger('game-destroyed');
};

_.merge(Game.prototype, Observable.general);

module.exports = Game;
