var _ = require('lodash');
var Observable = require('../base/observable');
var Game = require('./game');
var PREFIX = "game";
var CAPACITY = 12;

var Room = function(id, name) {
  this.name = name;
  this.$ = new Observable();
  this.id = id || PREFIX + Date.now();
  this.initGames();
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

Room.prototype.resetGame = function(game) {
  var index = this.games.indexOf(game);
  this.games[index] = new Game(this, index);
  this.bindGame(this.games[index]);
  this.trigger('game-reset', this.games[index], game);
};

Room.prototype.findGame = function(gameId) {
  return _.find(this.games, {
    id : gameId
  });
};

Room.prototype.hasGame = function(gameId) {
  return this.findGame(gameId) != undefined;
};

Room.prototype.toJSON = function() {
  return {
    id : this.id,
    name : this.name,
    games : this.games.map(function(game) {
      return game.toSimpleJSON();
    })
  };
};

Room.prototype.findGameByUser = function(account) {
  return _.find(this.games, function(game) {
    return game.findPlayer(account);
  });
};

_.merge(Room.prototype, Observable.general);

module.exports = Room;
