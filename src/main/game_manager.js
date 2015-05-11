var _ = require('lodash');
var Observable = require('./base/observable');
var RoomDAO = require('./daos/room');
var RuleDAO = require('./daos/rule');
var UserDAO = require('./daos/user');
var PuzzleDAO = require('./daos/puzzle');
var Room = require('./models/room');

var GameManager = function() {
  this.$ = new Observable();
  this.rooms = [];
};

GameManager.prototype.init = function(cb) {
  var self = this;
  RoomDAO.all(function(error, rooms) {
    if (error) {
      cb(error);
    } else {
      if (rooms) {
        rooms.forEach(function(room) {
          self.rooms.push(new Room(room.id, room.name));
        });
      }
      self.trigger('game-manager-init');
      cb();
    }
  });
};

GameManager.prototype.getLobbyData = function(account, cb) {
  var result = {
    rooms : this.rooms.map(function(room) {
      return room.toJSON();
    }),
    levels : PuzzleDAO.LEVELS
  };
  UserDAO.findOneByAccount(account, function(error, user) {
    if (error) {
      cb(error);
    } else {
      result.user = user.toJSON();
      RuleDAO.getRule(function(error, rule) {
        if (error) {
          cb(error);
        } else {
          result.rule = rule;
          cb(null, result);
        }
      });
    }
  });
};

GameManager.prototype.playerJoin = function(gameId, account, index, params, cb) {
  var self = this;
  var game = this.findGameByUser(account);
  if (game) {
    cb(null, {
      status : 'playing',
      gameId : game.id
    });
  } else {
    game = this.findGame(gameId);
    if (game) {
      if (game.isEmpty()) {
        game.init(account, params, function(error) {
          if (error) {
            cb(error);
          } else {
            game.playerJoin(account, 0, cb);
          }
        });
      } else {
        game.playerJoin(account, index, cb);
      }
    } else {
      cb("No game for id: " + gameId);
    }
  }
};

GameManager.prototype.playerQuit = function(account, cb) {
  var game = this.findGameByUser(account);
  if (game) {
    game.playerQuit(account, 'quit', cb);
  }
};

GameManager.prototype.findRoom = function(roomId) {
  return _.find(this.rooms, {
    id : roomId
  });
};

GameManager.prototype.findRoomByGameId = function(gameId) {
  return _.find(this.rooms, function(room) {
    return room.hasGame(gameId);
  });
};

GameManager.prototype.findGame = function(gameId) {
  return this.findRoomByGameId(gameId).findGame(gameId);
};

GameManager.prototype.submit = function(gameId, account, xy, value, cb) {
  var self = this;
  var game = this.findGame(gameId);
  var result = game.submit(account, xy, value, cb);
};

GameManager.prototype.autoSubmit = function(gameId, account, xy, cb) {
  var self = this;
  var game = this.findGame(gameId);
  var result = game.autoSubmit(account, xy, cb);
};

GameManager.prototype.peep = function(gameId, account, xy, cb) {
  var game = this.findGame(gameId);
  var result = game.peep(account, xy, cb);
};

GameManager.prototype.impunish = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  var result = game.impunish(account, cb);
};

GameManager.prototype.pass = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.pass(account, cb);
};

GameManager.prototype.delay = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.delay(account, cb);
};

GameManager.prototype.setOptionsOnce = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.setOptionsOnce(account, cb);
};

GameManager.prototype.setOptionsAlways = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.setOptionsAlways(account, cb);
};

GameManager.prototype.goahead = function(account, gameId) {
  this.findGame(gameId).goahead(account);
};

GameManager.prototype.addMessage = function(gameId, account, message) {
  return this.findGame(gameId).addMessage(message, account);
};

GameManager.prototype.hasLiveGame = function() {
  return _.find(this.games, function(game) {
    return !(game.isOver() || game.isEmpty());
  }) != undefined;
};

GameManager.prototype.setGameStatus = function(account, id, status) {
  var game = this.findGame(id);
  if (game) {
    game.setStatus(status);
  }
};

GameManager.prototype.findGameByUser = function(account) {
  var room = _.find(this.rooms, function(room) {
    return room.findGameByUser(account);
  });
  if (room) {
    return room.findGameByUser(account);
  }
};

_.merge(GameManager.prototype, Observable.general);

module.exports = GameManager;
