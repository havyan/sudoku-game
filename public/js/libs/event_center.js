(function() {
  can.Construct('EventReceiver', {
    createSystemEventReceiver : function() {
      var topics = ['game-init', 'game-player-joined', 'game-reset', 'game-player-quit',
                    'game-status-changed']; 
      return new EventReceiver('/events/system', topics);
    },

    createGameEventReceiver : function(gameId) {
      var topics = ['player-joined', 'message-added', 'status-changed', 'countdown-stage',
                    'cell-correct', 'cell-incorrect', 'switch-player', 'player-ellapsed-time',
                    'score-changed', 'game-over', 'puzzle-init', 'player-quit',
                    'max-timeout-reached', 'game-destroyed', 'quit-countdown-stage','game-destroyed',
                    'game-delayed', 'delay-countdown-stage', 'game-delay-cancelled', 'destroy-countdown-stage',
                    'wait-countdown-stage', 'game-abort', 'total-countdown-stage'];
      return new EventReceiver('/events/game/' + gameId, topics);
    }
  }, {
    init : function(url, topics) {
      var self = this;
      this.observable = new Observable();
      this.socket = io.connect(url);
      topics.forEach(function(topic) {
        self.socket.on(topic, function(data) {
          var args = JSON.parse(data);
          args.unshift(topic);
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
