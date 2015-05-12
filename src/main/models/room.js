var _ = require('lodash');
var Observable = require('../base/observable');
var Game = require('./game');
var PREFIX = "game";
var CAPACITY = 12;

var Room = function(id, name, virtual) {
  this.name = name;
  this.$ = new Observable();
  this.id = id || PREFIX + Date.now();
  this.virtual = virtual;
  if (virtual) {
    this.children = [];
  } else {
    this.initGames();
  }
};

Room.prototype.initGames = function() {
  this.games = [];
  for (var i = 0; i < CAPACITY; i++) {
    var game = new Game(this, i);
    this.bindGame(game);
    this.games.push(game);
  }
};

Room.prototype.bindGame = function(game) {
  var self = this;
  game.on('game-destroyed', function() {
    self.resetGame(game);
  });
};

Room.prototype.addRoom = function(room) {
  if (this.virtual) {
    this.children.push(room);
    return true;
  } else {
    return false;
  }
};

Room.prototype.resetGame = function(game) {
  var index = this.games.indexOf(game);
  this.games[index] = new Game(this, index);
  this.bindGame(this.games[index]);
  this.trigger('game-reset', this.games[index], game);
};

Room.prototype.getRealRooms = function() {
  var rooms = [];
  var collect = function(room) {
    if (room.virtual) {
      room.children.forEach(function(child) {
        collect(child);
      });
    } else {
      rooms.push(room);
    }
  };
  collect(this);
  return rooms;
};

Room.prototype.findGame = function(gameId) {
  var find = function(room) {
    if (room.virtual) {
      var game;
      _.each(room.children, function(child) {
        game = find(child);
        if (game) {
          return false;
        }
      });
      return game;
    } else {
      return _.find(room.games, {
        id : gameId
      });
    }
  };
  return find(this);
};

Room.prototype.hasGame = function(gameId) {
  return this.findGame(gameId) != undefined;
};

Room.prototype.hasLiveGame = function() {
  if (this.virtual) {
    return !_.every(this.children, function(child) {
      return !child.hasLiveGame();
    });
  } else {
    return !_.every(this.games, function(game) {
      return game.isOver() || game.isEmpty();
    });
  }
};

Room.prototype.toJSON = function() {
  return this.virtual ? {
    id : this.id,
    name : this.name,
    virtual : this.virtual,
    children : this.children.map(function(room) {
      return room.toJSON();
    })
  } : {
    id : this.id,
    name : this.name,
    virtual : this.virtual,
    games : this.games.map(function(game) {
      return game.toSimpleJSON();
    })
  };
};

Room.prototype.findGameByUser = function(account) {
  var find = function(room) {
    var game;
    if (room.virtual) {
      _.each(room.children, function(child) {
        game = find(child);
        if (game) {
          return false;
        }
      });
      return game;
    } else {
      _.each(room.games, function(g) {
        if (g.findPlayer(account)) {
          game = g;
          return false;
        }
      });
    }
  };
  return find(this);
};

_.merge(Room.prototype, Observable.general);

module.exports = Room;
