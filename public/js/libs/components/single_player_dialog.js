(function() {
  can.Control('SinglePlayerDialog', {
    defaults: {
      closable: true,
      showBattle: false
    }
  }, {
    init : function(element, options) {
      can.view('/js/libs/mst/single_player_dialog.mst', options, function(frag) {
        this.element.append(frag);
        if (options.visible) {
          this.element.find('.single-player-modal').modal();
        }
        if (options.mode) {
          this.selectMode(options.mode);
        }
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

    selectMode : function(mode) {
      this.element.find('.single-player-modal .play-mode input[data-value="' + mode + '"]').prop('checked', true);
    },

    '.single-player-modal .battle-play input click' : function(element) {
      this.element.find('.single-player-modal .signup-message .content').show();
    },

    '.single-player-modal .play-mode:not(.battle-play) input click' : function(element) {
      this.element.find('.single-player-modal .signup-message .content').hide();
    },

    '.single-player-modal .confirm click' : function(element) {
      if (this.callback) {
        this.callback(this.getParams());
      }
      this.close();
    }
  });
})();
