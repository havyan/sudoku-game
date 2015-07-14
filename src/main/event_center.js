var winston = require('winston');
var _ = require('lodash');
var SYSTEM_GAME_TOPICS = ['init', 'player-joined', 'player-quit', 'status-changed'];

var EventCenter = function(io) {
  this.io = io;
  this.systemEmitter = this.io.of('/events/system');
  this.gameEmitters = {};
  this.initEvents();
};

EventCenter.prototype.initEvents = function() {
  var self = this;
  global.gameManager.getRealRooms().forEach(function(room) {
    room.games.forEach(function(game) {
      self.bindGame(game);
    });

    room.on('game-reset', function(newGame, oldGame) {
      self.bindGame(newGame);
      self.systemEmitter.emit('game-reset', JSON.stringify([oldGame.id, newGame.toSimpleJSON()]));
    });
  });
};

EventCenter.prototype.bindGame = function(game) {
  var self = this;
  this.gameEmitters[game.id] = this.io.of('/events/game/' + game.id);
  game.any(function() {
    var topic = arguments[0];
    var topicArgs = [];
    if (arguments.length >= 2) {
      for (var i = 1; i < arguments.length; i++) {
        topicArgs.push(arguments[i]);
      }
    }
    self.gameEmitters[game.id].emit(topic, JSON.stringify(topicArgs));
    if (_.contains(SYSTEM_GAME_TOPICS, topic)) {
      topicArgs.unshift(game.id);
      self.systemEmitter.emit('game-' + topic, JSON.stringify(topicArgs));
    }
  });
};

module.exports = function(server) {
  global.eventCenter = new EventCenter(require('socket.io')(server));
};
