(function() {
	can.Construct('EventCenter', {}, {
		init : function(gameId) {
			var self = this;
			this.observable = new Observable();
			this.gameId = gameId;
			this.socket = io.connect('/events/game/' + gameId);
			var gameTopics = ['player-joined', 'message-added', 'status-changed',
			                  'countdown-stage', 'cell-correct', 'cell-incorrect',
			                  'switch-player', 'ellapsed-time', 'score-changed',
			                  'game-over', 'puzzle-init', 'player-quit',
			                  'max-timeout-reached', 'game-destroyed', 'quit-countdown-stage',
			                  'game-destroyed'];
			gameTopics.forEach(function(gameTopic) {
				self.socket.on(gameTopic, function(data) {
					var args = JSON.parse(data);
					args.unshift(gameTopic);
					self.trigger(args);
				});
			});
		},

		on : function(event, cb) {
			this.observable.on(event, cb);
		},

		trigger : function() {
			this.observable.trigger.apply(this.observable, arguments);
		}
	});
})();
