(function() {
  can.Control('SinglePlayerDialog', {
    defaults: {
      closable: true
    }
  }, {
    init : function(element, options) {
      can.view('/js/libs/mst/single_player_dialog.mst', options, function(frag) {
        this.element.append(frag);
        if (options.visible) {
          this.element.find('.single-player-modal').modal();
        }
        this.element.find('.play-mode.self-play input').prop('checked', true);
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
