(function() {
  can.Control('Treasure.LobbyGamePanel', {}, {
    init: function(element, options) {
      var _this = this;
      this.createModel();
      can.view('/js/libs/treasure/mst/lobby_game_panel.mst', this.model, {
        roleClass: function(role) {
          return _this.model.attr('selected') === role() ? 'selected' : '';
        }
      }, function(frag) {
        this.element.append(frag);
      }.bind(this));
    },

    '.role-item click': function(e) {
      this.model.attr('selected', e.data('role'));
    },

    createModel: function() {
      this.model = new can.Model({
        selected: 'girl',
        roles: [{
            code: 'girl',
            icon: '/imgs/default/girl.png'
          },
          {
            code: 'boy',
            icon: '/imgs/default/boy.png'
          }
        ]
      });
    },
  });
})();
