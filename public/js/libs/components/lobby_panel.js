(function() {
  can.Control('Components.LobbyPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/lobby_panel.mst', options.model, {
      	tableInfo: function(game) {
      		if(game.status === 'empty') {
      			return '空桌';
      		} else if (game.status === 'waiting') {
      			return '等待开始';
      		} else if (game.status === 'ongoing') {
      			return '';
      		}
      	}
      }));
      this.selectRoom(options.model.attr('selectedRoom'));
    },

    selectRoom : function(roomId) {
      this.element.find('.lobby-nav-room').removeClass('active');
      this.element.find('.lobby-nav-room[data-id=' + roomId + ']').addClass('active');
      this.element.find('.lobby-room').removeClass('active');
      this.element.find('.lobby-room[data-id=' + roomId + ']').addClass('active');
    },

    '.lobby-nav-room click' : function(e) {
      this.options.model.selectRoom(e.data('id'));
    },

    '{model} selectedRoom' : function(model, e, selectedRoom) {
      this.selectRoom(selectedRoom);
    },

    '.lobby-game.empty .lobby-player.player-0 click' : function(e) {
      var gameId = e.closest('.lobby-game').data('id');
      var gameForm = new LobbyGameForm(this.element, {
        callback : function(params) {
          Rest.Game.playerJoin(gameId, 0, params, function(result) {
            window.location.href = '/table/' + result.gameId;
          });
        }
      });
    }
  });
})();
