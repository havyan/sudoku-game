var winston = require('winston');
var _ = require('lodash');
var EVENTS = require('./events.json');
;

var EventCenter = function(io) {
  this.io = io;
  this.systemEmitter = this.io.of('/events/system');
  this.gameEmitters = {};
  this.initEvents();
};

EventCenter.prototype.initEvents = function() {
  var self = this;
  this.initGameEvents();
  global.gameManager.on('game-manager-reload', function() {
    self.initGameEvents();
  });
};

EventCenter.prototype.initGameEvents = function() {
  var self = this;
  global.gameManager.getRealRooms().forEach(function(room) {
    room.games.forEach(function(game) {
      self.bindGame(game);
    });

    room.on('game-replace', function(newGame, oldGame) {
      self.bindGame(newGame);
      self.systemEmitter.emit('game-replace', JSON.stringify([oldGame.id, newGame.toSimpleJSON()]));
    });
  });
};

EventCenter.prototype.bindGame = function(game) {
  var self = this;
  this.gameEmitters[game.id] = this.io.of('/events/game/' + game.id);
  EVENTS.GAME.forEach(function(topic) {
    game.on(topic, function() {
      self.gameEmitters[game.id].emit(topic, JSON.stringify(_.values(arguments)));
    });
  });

  EVENTS.SYSTEM_GAME.forEach(function(topic) {
    game.on(topic, function() {
      var args = _.values(arguments);
      args.unshift(game.id);
      self.systemEmitter.emit('game-' + topic, JSON.stringify(args));
    });
  });
};

module.exports = function(server) {
  global.eventCenter = new EventCenter(require('socket.io')(server));
};
