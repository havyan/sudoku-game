var _ = require('lodash');
var Async = require('async');
var util = require("util");
var EventEmitter = require('events').EventEmitter;
var RoomDAO = require('./daos/room');
var RuleDAO = require('./daos/rule');
var UserDAO = require('./daos/user');
var PuzzleDAO = require('./daos/puzzle');
var User = require('./models/user');
var Game = require('./models/game');
var Room = require('./models/room');
var PLAYING = 'playing';
var FREE = 'free';

var GameManager = function() {
  EventEmitter.call(this);
  this.rooms = [];
  this.singleGames = [];
};
util.inherits(GameManager, EventEmitter);

GameManager.prototype.reload = function(cb) {
  var self = this;
  this.destroy();
  this.rooms = [];
  this.singleGames = [];
  this.init(function(error) {
    if (error) {
      cb(error);
    } else {
      self.emit('game-manager-reload');
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
          var room = new Room(room.id, room.name, room.virtual, room.capacity, room.order);
          if (room.virtual) {
            _.filter(rooms, {
              parent: room.id
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
      self.emit('game-manager-init');
      cb();
    }
  });
};

GameManager.prototype.getLobbyData = function(account, cb) {
  var result = {
    rooms: this.rooms.map(function(room) {
      return room.toJSON();
    }),
    levels: PuzzleDAO.LEVELS,
    userStatus: this.findGameByUser(account) ? PLAYING : FREE
  };
  User.findOneByAccount(account, function(error, user) {
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
      status: 'playing',
      gameId: game.id
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

GameManager.prototype.createSingleGame = function(account, playMode, cb) {
  var game = this.findGameByUser(account);
  if (game) {
    cb(null, {
      status: 'error',
      reason: 'There has been an game ongoing'
    });
  } else {
    game = new Game(null, this.singleGames.length, null, playMode || 'single', account);
    this.singleGames.push(game);
    game.on('game-destroyed', function() {
      _.remove(this.singleGames, function(e) {
        return e === game;
      })
    }.bind(this));
    this.emit('single-game-created', game);
    Async.series([
      function(cb) {
        game.init(account, {
          duration: 99,
          stepTime: 60
        }, cb);
      },
      function(cb) {
        game.playerJoin(account, 0, cb);
      },
      function(cb) {
        if (playMode === 'robot') {
          game.addRobot();
        }
        game.switchStatus('loading', cb);
      }
    ], cb);
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
  if (!game) {
    game = this.findSingleGame(gameId);
  }
  return game;
};

GameManager.prototype.findSingleGame = function(gameId) {
  return _.find(this.singleGames, function(game) {
    return game.creator === gameId || game.id === gameId;
  });
};

GameManager.prototype.submit = function(gameId, account, xy, value, cb) {
  var self = this;
  var game = this.findGame(gameId);
  var result = game.submit(account, xy, value, cb);
};

GameManager.prototype.pass = function(gameId, account, cb) {
  var game = this.findGame(gameId);
  game.pass(account, cb);
};

GameManager.prototype.useProp = function(gameId, type, account, params, cb) {
  var game = this.findGame(gameId);
  return game.useProp(type, account, params, cb);
};

GameManager.prototype.goahead = function(account, gameId) {
  this.findGame(gameId).goahead(account);
};

GameManager.prototype.addMessage = function(gameId, account, message) {
  return this.findGame(gameId).addMessage(message, account);
};

GameManager.prototype.hasLiveGame = function() {
  var hasRoomGame = _.some(this.rooms, function(room) {
    return room.hasLiveGame();
  });
  var hasSingleGame = !_.every(this.singleGames, function(game) {
    return game.isOver() || game.isEmpty();
  });
  return hasRoomGame || hasSingleGame;
};

GameManager.prototype.switchGameStatus = function(account, id, status, cb) {
  var game = this.findGame(id);
  if (game) {
    game.switchStatus(status, cb);
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
  if (!game) {
    game = this.findSingleGame(account);
  }
  return game;
};

GameManager.prototype.destroy = function() {
  this.rooms.forEach(function(room) {
    room.destroy();
  });
  this.singleGames.forEach(function(game) {
    game.destroy();
  });
  this.emit('game-manager-destroyed');
};

module.exports = GameManager;
