var winston = require('winston');

var EventCenter = function(io) {
  this.io = io;
  this.systemEmitter = this.io.of('/events/system');
  this.initEvents();
  this.gameEmitters = {};
};

EventCenter.prototype.initEvents = function() {
  var self = this;
  global.gameManager.on('game-manager-init', function() {
    global.gameManager.rooms.forEach(function(room) {
      room.games.forEach(function(game) {
        self.bindGame(game);
      });

      room.on('game-reset', function(newGame, oldGame) {
        delete self.roomEmitters[oldGame.id];
        self.bindGame(newGame);
      });
    });
  });
};

EventCenter.prototype.initEvents.bindGame = function(game) {
  this.gameEmitters[game.id] = this.io.of('/events/game/' + game.id);
  game.any(function() {
    var topic = arguments[0];
    var topicArgs = [];
    if (arguments.length >= 2) {
      for (var i = 1; i < arguments.length; i++) {
        topicArgs.push(arguments[i]);
      }
    }
    this.gameEmitters[game.id].emit(topic, JSON.stringify(topicArgs));
  });
};

module.exports = function(server) {
  global.eventCenter = new EventCenter(require('socket.io')(server));
};
