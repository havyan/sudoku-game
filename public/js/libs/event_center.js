(function() {
  can.Construct('EventReceiver', {
    createSystemEventReceiver : function(cb) {
      return Rest.Events.getSystem(function(topics) {
        cb(new EventReceiver('/events/system', topics));
      });
    },

    createGameEventReceiver : function(gameId, cb) {
      return Rest.Events.getGame(function(topics) {
        cb(new EventReceiver('/events/game/' + gameId, topics));
      });
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
