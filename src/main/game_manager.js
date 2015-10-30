var _ = require('lodash');
var Observable = require('./base/observable');
var RoomDAO = require('./daos/room');
var RuleDAO = require('./daos/rule');
var UserDAO = require('./daos/user');
var PuzzleDAO = require('./daos/puzzle');
var Room = require('./models/room');
var PLAYING = 'playing';
var FREE = 'free';

var GameManager = function() {
  this.$ = new Observable();
  this.rooms = [];
};

GameManager.prototype.reload = function(cb) {
  var self = this;
  this.rooms = [];
  this.init(function(error) {
    if (error) {
      cb(error);
    } else {
      self.trigger('game-manager-reload');
      cb();
    }
  });
};

GameManager.prototype.init = function(cb) {
  var self = this;
  RoomDAO.all(function(error, rooms) {
    if (error) {
      cb(error);
    } else {
      if (rooms) {
        var build = function(room) {
          var room = new Room(room.id, room.name, room.virtual, room.capacity);
          if (room.virtual) {
            _.filter(rooms, {
              parent : room.id
            }).forEach(function(child) {
              room.addRoom(build(child));
            });
          }
          return room;
        };
        _.filter(rooms, function(room) {
          return room.virtual && _.isEmpty(room.parent);
        }).forEach(function(room) {
          self.rooms.push(build(room));
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
    levels : PuzzleDAO.LEVELS,
    userStatus : this.findGameByUser(account) ? PLAYING : FREE
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
      if (index === 0) {
        if (game.isEmpty()) {
          game.init(account, params, function(error) {
            if (error) {
              cb(error);
            } else {
              game.playerJoin(account, 0, cb);
            }
          });
        } else {
          cb('游戏已建立，请选择另外一桌。');
        }
      } else {
        game.playerJoin(account, index, cb);
      }
    } else {
      cb("No game for id: " + gameId);
    }
  }
};

GameManager.prototype.getRealRooms = function() {
  var rooms = [];
  this.rooms.forEach(function(room) {
    rooms = rooms.concat(room.getRealRooms());
  });
  return rooms;
};

GameManager.prototype.playerQuit = function(account, cb) {
  var game = this.findGameByUser(account);
  if (game) {
    game.playerQuit(account, 'quit', cb);
  }
};

GameManager.prototype.findGame = function(gameId) {
  var game;
  _.each(this.rooms, function(room) {
    game = room.findGame(gameId);
    if (game) {
      return false;
    }
  });
  return game;
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

GameManager.prototype.useGlasses = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.useGlasses(account, cb);
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
  return !_.every(this.rooms, function(room) {
    return !room.hasLiveGame();
  });
};

GameManager.prototype.setGameStatus = function(account, id, status) {
  var game = this.findGame(id);
  if (game) {
    game.setStatus(status);
  }
};

GameManager.prototype.findGameByUser = function(account) {
  var game;
  _.each(this.rooms, function(room) {
    game = room.findGameByUser(account);
    if (game) {
      return false;
    }
  });
  return game;
};

GameManager.prototype.destroy = function() {
  //TODO release resources
};

_.merge(GameManager.prototype, Observable.general);

module.exports = GameManager;
