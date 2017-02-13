(function() {
  can.Control('LobbyGameForm', {
  }, {
    init : function(element, options) {
      this.createModel();
      can.view('/js/libs/mst/lobby_game_form.mst', this.model, {
        isSelected : function(index) {
          if (index() === 0) {
            return 'selected';
          }
          return '';
        }
      }, function(frag) {
        this.element.append(frag);
        this.initDefault();
      }.bind(this));
    },

    initDefault : function() {
      var levels = this.model.attr('levels');
      $('.value.level select').val(levels.attr((levels.length - 1) + '.code'));
      $('.value.step-time select').val(this.model.attr('stepTimes.0.total'));
      $('.value.duration select').val(this.model.attr('durations.0'));
      $('.value.capacity select').val(this.model.attr('capacities.0'));
      $('.value.wait-time select').val(this.model.attr('waitTimes.0'));
    },

    createModel : function() {
      this.model = new can.Model({
        stepTimes : this.options.rule.score.add,
        levels : this.options.levels.slice(0, parseInt(this.options.user.grade) + 1),
        durations : [0.5, 1, 1.5, 2],
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
        level : this.element.find('.value.level select').val(),
        stepTime : parseInt(this.element.find('.value.step-time select').val()),
        duration : parseFloat(this.element.find('.value.duration select').val()),
        capacity : parseInt(this.element.find('.value.capacity select').val()),
        startMode : this.element.find('.value.start-mode input:checked').data('value'),
        waitTime : parseInt(this.element.find('.value.wait-time select').val())
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
