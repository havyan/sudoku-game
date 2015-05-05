(function() {
  can.Control('Components.LobbyPanel', {}, {
    init : function(element, options) {
      element.html(can.view('/js/libs/mst/lobby_panel.mst', options.model));
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
    
    '.lobby-game.empty .lobby-player.north click' : function() {
    	var gameForm = new LobbyGameForm(this.element, {});
    }
  });
})();
