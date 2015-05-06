(function() {
  can.Model('Models.LobbyModel', {}, {
    init : function(data, eventReceiver) {
      this.eventReceiver = eventReceiver;
      this.selectRoom(this.attr('rooms.0.id'));
      this.initEvents();
    },

    selectRoom : function(roomId) {
      this.attr('selectedRoom', roomId);
    },

    replaceGame : function(gameId, game) {
      var room = this.findRoomByGameId(gameId);
      var index = _.findIndex(room.attr('games'), {
        id : gameId
      });
      room.attr('games.' + index, game);
    },

    initEvents : function() {
      var self = this;
      this.eventReceiver.on('game-init', function(gameId, game) {
        self.replaceGame(gameId, game);
      });
      this.eventReceiver.on('game-player-joined', function(gameId, index, player) {
        self.setPlayer(gameId, index, player);
      });
    },

    setPlayer : function(gameId, index, player) {
      this.findGame(gameId).attr('players').attr(index, player);
    },

    findRoomByGameId : function(gameId) {
      return _.find(this.attr('rooms'), function(room) {
        return _.find(room.attr('games'), {
          id : gameId
        });
      });
    },

    findGame : function(gameId) {
      var room = this.findRoomByGameId(gameId);
      if (room) {
        return _.find(room.attr('games'), {
          id : gameId
        });
      }
    }
  });
})();
