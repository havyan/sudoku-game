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

GameManager.prototype.submit = function(gameId, account, xy, value, cb) {
  var self = this;
  var game = this.getGame(gameId);
  var result = game.submit(account, xy, value, function(error, result) {
    if (result && result.over) {
      setTimeout(function() {
        self.destroyGame(gameId);
      }, 60000);
    }
    cb(error, result);
  });
};

GameManager.prototype.autoSubmit = function(gameId, account, xy, cb) {
  var self = this;
  var game = this.getGame(gameId);
  var result = game.autoSubmit(account, xy, function(error, result) {
    if (result && result.over) {
      setTimeout(function() {
        self.destroyGame(gameId);
      }, 60000);
    }
    cb(error, result);
  });
};

GameManager.prototype.peep = function(gameId, account, xy, cb) {
  var game = this.getGame(gameId);
  var result = game.peep(account, xy, cb);
};

GameManager.prototype.impunish = function(gameId, account, cb) {
  var game = this.getGame(gameId);
  var result = game.impunish(account, cb);
};

GameManager.prototype.pass = function(gameId, account, cb) {
  var game = this.getGame(gameId);
  game.pass(account, cb);
};

GameManager.prototype.delay = function(gameId, account, cb) {
  var game = this.getGame(gameId);
  game.delay(account, cb);
};

GameManager.prototype.setOptionsOnce = function(gameId, account, cb) {
  var game = this.getGame(gameId);
  game.setOptionsOnce(account, cb);
};

GameManager.prototype.setOptionsAlways = function(gameId, account, cb) {
  var game = this.getGame(gameId);
  game.setOptionsAlways(account, cb);
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
