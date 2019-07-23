(function() {
  Components.GamePanel.extend('Treasure.Components.GamePanel', {
    defaults: {
      template: '/js/libs/treasure/mst/game_panel.mst'
    }
  }, {
    init : function(element, options) {
      this._super(element, options);
    },

    createChessboard: function() {
      return new Treasure.Chessboard($('.game-main-area'), {
        model : this.options.model
      });
    },
  });
})();
