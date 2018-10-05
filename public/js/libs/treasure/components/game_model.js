(function() {
  Models.GameModel.extend('Treasure.Models.GameModel', {}, {
    init : function(game, eventReceiver) {
      this._super(game, eventReceiver);
      this.initType();
      this.initPositionStatus();
    },

    initType: function() {
      this.attr('type', 'treasure');
    },

    initPositionStatus: function() {
      this.attr('positionStatus', 'out');
    }
  });
})();
