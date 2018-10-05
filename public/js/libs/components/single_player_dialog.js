(function() {
  can.Control('SinglePlayerDialog', {
    defaults: {
      closable: true,
      showBattle: false,
      hasUnfinished: true
    }
  }, {
    init : function(element, options) {
      this.model = new can.Model({
        closable: options.closable,
        showBattle: options.showBattle,
        hasUnfinished: options.hasUnfinished
      });
      can.view('/js/libs/mst/single_player_dialog.mst', this.model, function(frag) {
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

    show : function(params, callback) {
      this.model.attr(params);
      this.resetUnfinished();
      this.callback = callback;
      this.element.find('.single-player-modal').modal();
    },

    resetUnfinished: function() {
      var mode = this.getSelectedMode();
      var model = this.model;
      model.attr('hasUnfinished', (mode === 'single' && !!model.attr('unfinishedSingle')) || (mode === 'robot' && !!model.attr('unfinishedRobot')))
    },

    getParams : function() {
      return {
        playMode: this.getSelectedMode(),
        continueLast: this.model.attr('continueLast')
      };
    },

    getSelectedMode: function() {
      return this.element.find('.single-player-modal .play-mode input:checked').data('value');
    },

    selectMode : function(mode) {
      this.element.find('.single-player-modal .play-mode input[data-value="' + mode + '"]').prop('checked', true);
    },

    '.single-player-modal .battle-play input click' : function(element) {
      this.element.find('.single-player-modal .signup-message .content').show();
      this.element.find('.single-player-modal .lobby-modal-bottom button').attr('disabled', true);
    },

    '.single-player-modal .play-mode:not(.battle-play) input click' : function(element) {
      this.element.find('.single-player-modal .signup-message .content').hide();
      this.element.find('.single-player-modal .lobby-modal-bottom button').removeAttr('disabled');
      this.resetUnfinished();
    },

    '.single-player-modal .confirm click' : function(element) {
      if (this.callback) {
        this.model.attr('continueLast', element.data('value') === 'continue')
        this.callback(this.getParams());
      }
      this.close();
    }
  });
})();
