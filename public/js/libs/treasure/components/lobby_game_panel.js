(function() {
  can.Control('Treasure.LobbyGamePanel', {}, {
    init: function(element, options) {
      this.createModel();
      can.view('/js/libs/tresure/mst/lobby_game_panel.mst', this.model, function(frag) {
        this.element.append(frag);
      }.bind(this));
    },

    createModel: function() {
      this.model = new can.Model({
        roles: [{
            code: 'girl',
            icon: ''
          },
          {
            code: 'boy',
            icon: ''
          }
        ]
      });
    },
  });
})();
