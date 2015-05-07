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
      if (room) {
        var index = _.findIndex(room.attr('games'), {
          id : gameId
        });
        room.attr('games.' + index, game);
      }
    },

    initEvents : function() {
      var self = this;
      this.eventReceiver.on('game-init', function(gameId, game) {
        self.replaceGame(gameId, game);
      });
      this.eventReceiver.on('game-status-changed', function(gameId, status, oldStatus) {
        self.setGameStatus(gameId, status);
      });
      this.eventReceiver.on('game-player-joined', function(gameId, index, player) {
        self.setPlayer(gameId, index, player);
      });
      this.eventReceiver.on('game-player-quit', function(gameId, data) {
        self.playerQuit(gameId, data.account);
      });
      this.eventReceiver.on('game-reset', function(gameId, newGame) {
        self.replaceGame(gameId, newGame);
      });
    },

    playerQuit : function(gameId, account) {
      var game = this.findGame(gameId);
      if (game) {
        var index = _.findIndex(game.attr('players'), function(player) {
          return player && player.account === account;
        });
        if (index >= 0) {
          game.attr('players').attr(index, null);
        }
      }
      this.replaceGame(gameId, game.attr());
    },

    setGameStatus : function(gameId, status) {
      var game = this.findGame(gameId);
      game.attr('status', status);
      this.replaceGame(gameId, game.attr());
    },

    setPlayer : function(gameId, index, player) {
      var game = this.findGame(gameId);
      game.attr('players').attr(index, player);
      this.replaceGame(gameId, game.attr());
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
