(function() {
  var BG_COLORS = ['#4A94F0', '#607E02', '#F1AD08', '#DB1723'];
  can.Control('GameTimer', {
  }, {
    init : function(element, options) {
      can.view('/js/libs/mst/game_timer.mst', options.model, function(frag) {
        element.html(frag);
        this.element.find('.game-timer-delay').css('opacity', options.model.attr('delayCountdownStage') / 60);
        this.render(options.model, options.model.attr('playerRemainingTime'));
      }.bind(this));
    },

    '{model} playerRemainingTime' : function(model, e, playerRemainingTime) {
      this.render(model, playerRemainingTime);
    },

    render : function(model, playerRemainingTime) {
      if (model.isActive()) {
        var totalTime = model.totalTime();
        var ellapsedTime = totalTime - playerRemainingTime;
        var bgSVG = this.element.find('.game-timer-background svg');
        var radius = bgSVG.parent().width() / 2;
        var radian = 2 * Math.PI * ellapsedTime / totalTime;
        var x = radius + radius * Math.sin(radian);
        var y = radius - radius * Math.cos(radian);
        var path = 'M' + radius + ' ' + radius + ' L ' + radius + ' 0 ';
        path += 'A ' + radius + ' ' + radius + ' 0 ' + ((playerRemainingTime > totalTime / 2) ? 1 : 0) + ' 0 ' + x + ' ' + y + ' ';
        path += 'L ' + radius + ' ' + radius + ' Z';
        var levels = model.attr('rule.score.add.levels');
        var levelIndex = _.findIndex(levels, function(level) {
          return ellapsedTime >= level.attr('from') && ellapsedTime < level.attr('to');
        });
        if (ellapsedTime === 0) {
          levelIndex = 0;
          this.element.find('.game-timer-background').css('background', BG_COLORS[BG_COLORS.length - levels.length + levelIndex]);
        } else {
          this.element.find('.game-timer-background').css('background', 'white');
        }
        bgSVG.find('path').attr('d', path).attr('fill', BG_COLORS[BG_COLORS.length - levels.length + levelIndex]);
      }
    },

    '{model} active' : function(model, e, active) {
      if (!active) {
        this.resetBackground();
      }
    },

    '{model} delayCountdownStage' : function(model, e, stage) {
      this.element.find('.game-timer-delay').css('opacity', stage / 60);
    },

    resetBackground : function() {
      this.element.find('.game-timer-background').css('background', 'white').find('path').attr('d', 'M0 0 Z').attr('fill', '#FFFFFF');
    }
  });
})();
