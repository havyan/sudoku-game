var winston = require('winston');

var EventCenter = function(io) {
	this.io = io;
	this.bind();
	this.roomEmitters = {};
	this.userEmitters = {};
};

EventCenter.prototype.bind = function() {
	var self = this;
	var gameManager = global.gameManager;
	gameManager.on('game-created', function(game) {
		var gameId = game.id;
		winston.info("Game " + gameId + " created");
		var roomEmitter = self.io.of('/events/game/' + gameId).on('connection', function(socket) {
			// TODO find how to get session
		});
		self.roomEmitters[gameId] = roomEmitter;
		game.any(function() {
			var topic = arguments[0];
			var topicArgs = [];
			if (arguments.length >= 2) {
				for (var i = 1; i < arguments.length; i++) {
					topicArgs.push(arguments[i]);
				}
			}
			roomEmitter.emit(topic, JSON.stringify(topicArgs));
		});
	});

	gameManager.on('game-removed', function(game) {
		delete self.roomEmitters[game.id];
	});
};

module.exports = function(server) {
	global.eventCenter = new EventCenter(require('socket.io')(server));
};
