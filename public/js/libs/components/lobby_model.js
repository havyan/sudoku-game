(function() {
  can.Model('Models.LobbyModel', {}, {
    init : function(data, eventReceiver) {
      this.eventReceiver = eventReceiver;
      var selectedRoom;
      var favariteRoomId = window.localStorage.getItem('favarite_room');
      if (favariteRoomId) {
        var favariteRoom = this.findRoom(favariteRoomId);
        if (favariteRoom) {
          if (favariteRoom.attr('virtual')) {
            selectedRoom = favariteRoom.attr('children.0.id');
          } else {
            selectedRoom = favariteRoom.attr('id');
          }
        }
      }
      if (!selectedRoom) {
        selectedRoom = this.find(function(room) {
          return room.id;
        });
      }
      this.selectRoom(selectedRoom);
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
      this.eventReceiver.on('game-replace', function(gameId, newGame) {
        self.replaceGame(gameId, newGame);
      });
      this.eventReceiver.on('system-reload', function() {
        self.attr('reload', Date.now());
      });
    },

    playerQuit : function(gameId, account) {
      if (account === this.attr('user.account')) {
        this.attr('userStatus', 'free');
      }
      var game = this.findGame(gameId);
      if (game) {
        var index = _.findIndex(game.attr('players'), function(player) {
          return player && player.account === account;
        });
        if (index >= 0) {
          game.attr('players').attr(index, null);
        }
        this.replaceGame(gameId, game.attr());
      }
    },

    setGameStatus : function(gameId, status) {
      var game = this.findGame(gameId);
      if (game) {
        game.attr('status', status);
        this.replaceGame(gameId, game.attr());
      }
    },

    setPlayer : function(gameId, index, player) {
      if (player.account === this.attr('user.account')) {
        this.attr('userStatus', 'playing');
      }
      var game = this.findGame(gameId);
      if (game) {
        game.attr('players').attr(index, player);
        this.replaceGame(gameId, game.attr());
      }
    },

    findRoom : function(roomId) {
      var self = this;
      var result;
      var find = function(room) {
        var result;
        if (roomId === room.attr('id')) {
          result = room;
          return room;
        } else {
          if (room.attr('virtual')) {
            _.each(room.attr('children'), function(child) {
              result = find(child);
              if (result) {
                return false;
              }
            });
          }
        }
        return result;
      };
      _.each(this.attr('rooms'), function(room) {
        result = find(room);
        if (result) {
          return false;
        }
      });
      return result;
    },

    findRealRoom : function(roomId) {
      return this.find(function(room) {
        if (roomId === room.attr('id')) {
          return room;
        }
      });
    },

    findRoomByGameId : function(gameId) {
      return this.find(function(room) {
        var game = _.find(room.attr('games'), {
          id : gameId
        });
        if (game) {
          return room;
        }
      });
    },

    findGame : function(gameId) {
      return this.find(function(room) {
        return _.find(room.attr('games'), {
          id : gameId
        });
      });
    },

    findPlayer : function(playerId) {
      return this.find(function(room) {
        var player;
        _.each(room.attr('games'), function(game) {
          player = _.find(game.attr('players'), function(player) {
            return player && player.id === playerId;
          });
          if (player) {
            return false;
          }
        });
        return player;
      });
    },

    find : function(callback) {
      var result;
      var find = function(room) {
        var result;
        if (room.attr('virtual')) {
          _.each(room.attr('children'), function(child) {
            result = find(child);
            if (result) {
              return false;
            }
          });
        } else {
          result = callback(room);
        }
        return result;
      };
      _.each(this.attr('rooms'), function(room) {
        result = find(room);
        if (result) {
          return false;
        }
      });
      return result;
    }
  });
})();
