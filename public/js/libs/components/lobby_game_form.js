(function() {
  can.Control('LobbyGameForm', {
  }, {
    init : function(element, options) {
      this.element.append(can.view('/js/libs/mst/lobby_game_form.mst'));
      var modelElement = this.element.find('.lobby-game-form');
      modelElement.on('hidden.bs.modal', function() {
        dialogElement.remove();
      });
      modelElement.modal();
    },

    close : function() {
      this.element.find('.lobby-game-form').remove();
    },

    '.lobby-game-form .close click' : function(element) {
      this.close();
    },

    '.lobby-game-form .confirm click' : function(element) {
      if (this.options.callback) {
        this.options.callback();
      }
      this.close();
    }
  });
})();
