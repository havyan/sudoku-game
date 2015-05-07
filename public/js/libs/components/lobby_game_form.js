(function() {
  can.Control('LobbyGameForm', {
  }, {
    init : function(element, options) {
      this.createModel();
      this.element.append(can.view('/js/libs/mst/lobby_game_form.mst', this.model));
      var modelElement = this.element.find('.lobby-game-form');
      modelElement.on('hidden.bs.modal', function() {
        modelElement.remove();
      });
      modelElement.modal();
    },

    createModel : function() {
      this.model = new can.Model({
        stepTimers : this.options.rule.score.add,
        levels : this.options.levels.slice(0, parseInt(this.options.user.grade) + 1),
        durations : [2, 3, 4, 5, 6, 7, 8, 9, 10],
        capacities : [2, 3, 4]
      });
    },

    close : function() {
      this.element.find('.lobby-game-form').remove();
    },

    '.lobby-game-form .close click' : function(element) {
      this.close();
    },

    getParams : function() {
      return {
        level : this.element.find('.value.level option:selected').data('code'),
        stepTime : this.element.find('.value.step-time option:selected').data('total'),
        duration : this.element.find('.value.duration option:selected').data('value') * 3600,
        capacity : this.element.find('.value.capacity option:selected').data('value'),
        startMode : this.element.find('.value.start-mode input:checked').data('value')
      };
    },

    '.lobby-game-form .confirm click' : function(element) {
      if (this.options.callback) {
        this.options.callback(this.getParams());
      }
      this.close();
    }
  });
})();
