var _ = require('lodash');
var util = require("util");
var EventEmitter = require('events').EventEmitter;
var Game = require('./game');
var PREFIX = "game";
var CAPACITY = 12;

var Room = function(id, name, virtual, capacity, order) {
  EventEmitter.call(this);
  this.name = name;
  this.capacity = capacity || CAPACITY;
  this.id = id || PREFIX + Date.now();
  this.virtual = virtual;
  this.order = order;
  if (virtual) {
    this.children = [];
  } else {
    this.initGames();
  }
};
util.inherits(Room, EventEmitter);

Room.prototype.initGames = function() {
  this.games = [];
  for (var i = 0; i < this.capacity; i++) {
    var game = new Game(this, i);
    this.bindGame(game);
    this.games.push(game);
  }
};

Room.prototype.bindGame = function(game) {
  var self = this;
  game.on('game-destroyed', function() {
    if (!self.destroying) {
      self.resetGame(game);
    }
  });
};

Room.prototype.addRoom = function(room) {
  if (this.virtual) {
    this.children.push(room);
    this.children.sort(function(child1, child2) {
      return (child1.order || 0) - (child2.order || 0);
    });
    return true;
  } else {
    return false;
  }
};

Room.prototype.resetGame = function(game) {
  var index = this.games.indexOf(game);
  this.games[index] = new Game(this, index);
  this.bindGame(this.games[index]);
  this.emit('game-replace', this.games[index], game);
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
    } else {
      _.each(room.games, function(g) {
        if (g.findPlayer(account)) {
          game = g;
          return false;
        }
      });
    }
    return game;
  };
  return find(this);
};

Room.prototype.destroy = function() {
  this.destroying = true;
  if (this.virtual) {
    this.children.forEach(function(child) {
      child.destroy();
    });
  } else {
    this.games.forEach(function(game) {
      game.destroy();
    });
  }
};

module.exports = Room;
