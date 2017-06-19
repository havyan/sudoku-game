(function() {
  can.Control('SinglePlayerDialog', {
  }, {
    init : function(element, options) {
      can.view('/js/libs/mst/single_player_dialog.mst', this.model, function(frag) {
        this.element.append(frag);
      }.bind(this));
    },

    close : function() {
      this.element.find('.single-player-modal').modal('hide');
    },

    '.single-player-modal .close click' : function(element) {
      this.close();
    },

    show : function(callback) {
      this.callback = callback;
      this.element.find('.single-player-modal').modal();
    },

    getParams : function() {
      return {
        playMode : this.element.find('.single-player-modal .play-mode input:checked').data('value')
      };
    },

    '.single-player-modal .confirm click' : function(element) {
      if (this.callback) {
        this.callback(this.getParams());
      }
      this.close();
    }
  });
})();
