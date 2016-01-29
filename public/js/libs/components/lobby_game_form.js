(function() {
  can.Control('LobbyGameForm', {
  }, {
    init : function(element, options) {
      this.createModel();
      can.view('/js/libs/mst/lobby_game_form.mst', this.model, function(frag) {
        this.element.append(frag);
      }.bind(this));
    },

    createModel : function() {
      this.model = new can.Model({
        stepTimes : this.options.rule.score.add,
        levels : this.options.levels.slice(0, parseInt(this.options.user.grade) + 1),
        durations : [2, 3, 4, 5, 6, 7, 8, 9, 10],
        capacities : [2, 3, 4],
        waitTimes : [1, 2, 5, 10]
      });
    },

    close : function() {
      this.element.find('.lobby-game-form').modal('hide');
    },

    '.lobby-game-form .close click' : function(element) {
      this.close();
    },

    show : function(callback) {
      this.callback = callback;
      this.element.find('.lobby-game-form').modal();
    },

    getParams : function() {
      return {
        level : this.element.find('.value.level option:selected').data('code'),
        stepTime : this.element.find('.value.step-time option:selected').data('total'),
        duration : this.element.find('.value.duration option:selected').data('value'),
        capacity : this.element.find('.value.capacity option:selected').data('value'),
        startMode : this.element.find('.value.start-mode input:checked').data('value'),
        waitTime : this.element.find('.value.wait-time option:selected').data('value')
      };
    },

    '.lobby-game-form .confirm click' : function(element) {
      if (this.callback) {
        this.callback(this.getParams());
      }
      this.close();
    }
  });
})();
